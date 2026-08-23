import { describe, expect, it, vi } from "vitest";
import { EliminarFotoUseCase } from "./eliminar-foto.use-case";
import { Foto } from "../../domain/entities/foto.entity";
import {
  FotoNoEncontradaError,
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
  UltimaFotoPropiedadVisibleError,
} from "../../domain/errors/dominio-multimedia.errors";
import type { FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import type { AlmacenamientoObjetosPort } from "../../domain/ports/almacenamiento-objetos.port";
import type { PropiedadAccesoPort, PropiedadAcceso } from "../../domain/ports/propiedad-acceso.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function fotoPersistida(id: string, orden: number, esPortada: boolean): Foto {
  return Foto.reconstituir({
    id, propiedadId: "p-1", orden, esPortada, s3KeyBase: `propiedades/p-1/${id}`,
    formatoOriginal: "jpg", createdAt: AHORA, updatedAt: AHORA,
  });
}

function buildDeps(acceso: PropiedadAcceso | null, existentes: Foto[] = []) {
  const propiedades: PropiedadAccesoPort = { obtener: vi.fn().mockResolvedValue(acceso) };
  const fotos: FotoRepositoryPort = {
    listarPorPropiedad: vi.fn().mockResolvedValue(existentes),
    sincronizar: vi.fn().mockResolvedValue(undefined),
  };
  const almacenamiento: AlmacenamientoObjetosPort = {
    subirVariantes: vi.fn().mockResolvedValue(undefined),
    eliminarPrefijos: vi.fn().mockResolvedValue(undefined),
    urlDe: vi.fn().mockReturnValue("https://cdn/x.webp"),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, fotos, almacenamiento, reloj };
}

function build(deps: ReturnType<typeof buildDeps>) {
  return new EliminarFotoUseCase(deps.propiedades, deps.fotos, deps.almacenamiento, deps.reloj);
}

const tres = () => [
  fotoPersistida("a", 1, true),
  fotoPersistida("b", 2, false),
  fotoPersistida("c", 3, false),
];

describe("EliminarFotoUseCase (RN-032 / ADR-008)", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const uc = build(buildDeps(null));
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "x", fotoId: "a" }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoMultimediaError si el Agente no es el dueño (RN-010)", async () => {
    const uc = build(buildDeps({ agenteId: "otro", esVisible: true }, tres()));
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, propiedadId: "p-1", fotoId: "b" }),
    ).rejects.toBeInstanceOf(SinPermisoMultimediaError);
  });

  it("elimina la foto, purga su binario del almacenamiento y sincroniza (RN-032)", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, tres());
    const uc = build(deps);
    await uc.ejecutar({ actor: { id: "u", rol: "editor" }, propiedadId: "p-1", fotoId: "b" });
    expect(deps.almacenamiento.eliminarPrefijos).toHaveBeenCalledWith(["propiedades/p-1/b"]);
    expect(deps.fotos.sincronizar).toHaveBeenCalledTimes(1);
    const arg = (deps.fotos.sincronizar as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.idsEliminadas).toEqual(["b"]);
    expect(arg.fotos.map((f: Foto) => f.id)).toEqual(["a", "c"]);
  });

  it("lanza FotoNoEncontradaError si la foto no existe y no purga nada", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, tres());
    const uc = build(deps);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "p-1", fotoId: "x" }),
    ).rejects.toBeInstanceOf(FotoNoEncontradaError);
    expect(deps.almacenamiento.eliminarPrefijos).not.toHaveBeenCalled();
    expect(deps.fotos.sincronizar).not.toHaveBeenCalled();
  });

  it("lanza UltimaFotoPropiedadVisibleError al eliminar la única foto de una propiedad visible (ADR-008)", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, [fotoPersistida("a", 1, true)]);
    const uc = build(deps);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "p-1", fotoId: "a" }),
    ).rejects.toBeInstanceOf(UltimaFotoPropiedadVisibleError);
    expect(deps.almacenamiento.eliminarPrefijos).not.toHaveBeenCalled();
  });

  it("permite eliminar la última foto si la propiedad NO es visible", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: false }, [fotoPersistida("a", 1, true)]);
    const uc = build(deps);
    await uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "p-1", fotoId: "a" });
    expect(deps.almacenamiento.eliminarPrefijos).toHaveBeenCalledWith(["propiedades/p-1/a"]);
  });
});
