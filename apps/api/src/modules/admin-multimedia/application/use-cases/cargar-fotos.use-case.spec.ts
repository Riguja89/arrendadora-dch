import { describe, expect, it, vi } from "vitest";
import { CargarFotosUseCase, type ArchivoParaCargar } from "./cargar-fotos.use-case";
import { Foto } from "../../domain/entities/foto.entity";
import {
  MaximoFotosExcedidoError,
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import type { FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import type { AlmacenamientoObjetosPort } from "../../domain/ports/almacenamiento-objetos.port";
import type { OptimizadorImagenesPort } from "../../domain/ports/optimizador-imagenes.port";
import type { PropiedadAccesoPort, PropiedadAcceso } from "../../domain/ports/propiedad-acceso.port";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function fotoPersistida(id: string, orden: number, esPortada: boolean): Foto {
  return Foto.reconstituir({
    id, propiedadId: "p-1", orden, esPortada, s3KeyBase: `propiedades/p-1/${id}`,
    formatoOriginal: "jpg", createdAt: AHORA, updatedAt: AHORA,
  });
}

function archivo(nombre: string, mime: string, tamanoBytes = 1024): ArchivoParaCargar {
  return { nombre, mime, tamanoBytes, datos: Buffer.from("bytes") };
}

function buildDeps(opts: { acceso: PropiedadAcceso | null; existentes?: Foto[] }) {
  let contador = 0;
  const propiedades: PropiedadAccesoPort = { obtener: vi.fn().mockResolvedValue(opts.acceso) };
  const fotos: FotoRepositoryPort = {
    listarPorPropiedad: vi.fn().mockResolvedValue(opts.existentes ?? []),
    sincronizar: vi.fn().mockResolvedValue(undefined),
  };
  const almacenamiento: AlmacenamientoObjetosPort = {
    subirVariantes: vi.fn().mockResolvedValue(undefined),
    eliminarPrefijos: vi.fn().mockResolvedValue(undefined),
    urlDe: vi.fn().mockReturnValue("https://cdn/x.webp"),
  };
  const optimizador: OptimizadorImagenesPort = {
    optimizar: vi.fn().mockResolvedValue([
      { variante: "original", datos: Buffer.from("o"), contentType: "image/webp" },
    ]),
  };
  const idGenerator: IdGeneratorPort = { nuevo: vi.fn().mockImplementation(() => `id-${++contador}`) };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, fotos, almacenamiento, optimizador, idGenerator, reloj };
}

function build(deps: ReturnType<typeof buildDeps>) {
  return new CargarFotosUseCase(
    deps.propiedades, deps.fotos, deps.almacenamiento, deps.optimizador, deps.idGenerator, deps.reloj,
  );
}

describe("CargarFotosUseCase (CU-001)", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const uc = build(buildDeps({ acceso: null }));
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "x", archivos: [] }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoMultimediaError si el Agente no es el dueño (RN-010)", async () => {
    const uc = build(buildDeps({ acceso: { agenteId: "otro", esVisible: true } }));
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, propiedadId: "p-1", archivos: [archivo("a.jpg", "image/jpeg")] }),
    ).rejects.toBeInstanceOf(SinPermisoMultimediaError);
  });

  it("carga los válidos y reporta los inválidos sin cancelarlos (RN-028)", async () => {
    const deps = buildDeps({ acceso: { agenteId: null, esVisible: true } });
    const uc = build(deps);
    const res = await uc.ejecutar({
      actor: { id: "u", rol: "administrador" },
      propiedadId: "p-1",
      archivos: [archivo("ok.jpg", "image/jpeg"), archivo("malo.gif", "image/gif")],
    });
    expect(res.cargadas).toHaveLength(1);
    expect(res.rechazadas).toEqual([{ nombreArchivo: "malo.gif", motivo: "Formato no compatible. Usá JPG, PNG o WEBP." }]);
    expect(deps.optimizador.optimizar).toHaveBeenCalledTimes(1);
    expect(deps.almacenamiento.subirVariantes).toHaveBeenCalledTimes(1);
    expect(deps.fotos.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("la primera foto de una galería vacía queda como portada (RN-014)", async () => {
    const deps = buildDeps({ acceso: { agenteId: null, esVisible: true } });
    const uc = build(deps);
    const res = await uc.ejecutar({
      actor: { id: "u", rol: "administrador" },
      propiedadId: "p-1",
      archivos: [archivo("a.jpg", "image/jpeg")],
    });
    expect(res.cargadas[0]!.esPortada).toBe(true);
    expect(res.cargadas[0]!.orden).toBe(1);
  });

  it("si no hay archivos válidos, no sube nada ni sincroniza y devuelve solo rechazadas", async () => {
    const deps = buildDeps({ acceso: { agenteId: null, esVisible: true } });
    const uc = build(deps);
    const res = await uc.ejecutar({
      actor: { id: "u", rol: "administrador" },
      propiedadId: "p-1",
      archivos: [archivo("malo.gif", "image/gif")],
    });
    expect(res.cargadas).toHaveLength(0);
    expect(res.rechazadas).toHaveLength(1);
    expect(deps.almacenamiento.subirVariantes).not.toHaveBeenCalled();
    expect(deps.fotos.sincronizar).not.toHaveBeenCalled();
  });

  it("lanza MaximoFotosExcedidoError sin subir binarios si excedería el tope de 10 (ADR-008)", async () => {
    const existentes = Array.from({ length: 9 }, (_, i) => fotoPersistida(`f${i}`, i + 1, i === 0));
    const deps = buildDeps({ acceso: { agenteId: null, esVisible: true }, existentes });
    const uc = build(deps);
    await expect(
      uc.ejecutar({
        actor: { id: "u", rol: "administrador" },
        propiedadId: "p-1",
        archivos: [archivo("a.jpg", "image/jpeg"), archivo("b.jpg", "image/jpeg")],
      }),
    ).rejects.toBeInstanceOf(MaximoFotosExcedidoError);
    expect(deps.almacenamiento.subirVariantes).not.toHaveBeenCalled();
    expect(deps.fotos.sincronizar).not.toHaveBeenCalled();
  });

  it("nunca sube al almacenamiento real: usa el puerto mockeado (no I/O)", async () => {
    const deps = buildDeps({ acceso: { agenteId: null, esVisible: true } });
    const uc = build(deps);
    await uc.ejecutar({
      actor: { id: "u", rol: "administrador" },
      propiedadId: "p-1",
      archivos: [archivo("a.jpg", "image/jpeg"), archivo("b.png", "image/png")],
    });
    expect(deps.almacenamiento.subirVariantes).toHaveBeenCalledTimes(2);
    for (const call of (deps.almacenamiento.subirVariantes as ReturnType<typeof vi.fn>).mock.calls) {
      expect(call[0]).toMatch(/^propiedades\/p-1\/id-\d+$/);
    }
  });
});
