import { describe, expect, it, vi } from "vitest";
import { DefinirPortadaUseCase } from "./definir-portada.use-case";
import { Foto } from "../../domain/entities/foto.entity";
import {
  FotoNoEncontradaError,
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import type { FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
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
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, fotos, reloj };
}

const dos = () => [fotoPersistida("a", 1, true), fotoPersistida("b", 2, false)];

describe("DefinirPortadaUseCase (RN-014)", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const deps = buildDeps(null);
    const uc = new DefinirPortadaUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "x", fotoId: "a" }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoMultimediaError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps({ agenteId: "otro", esVisible: true }, dos());
    const uc = new DefinirPortadaUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, propiedadId: "p-1", fotoId: "b" }),
    ).rejects.toBeInstanceOf(SinPermisoMultimediaError);
  });

  it("marca la foto indicada como portada única, al inicio, y persiste (RN-014)", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, dos());
    const uc = new DefinirPortadaUseCase(deps.propiedades, deps.fotos, deps.reloj);
    const fotos = await uc.ejecutar({ actor: { id: "u", rol: "editor" }, propiedadId: "p-1", fotoId: "b" });
    expect(fotos.map((f) => f.id)).toEqual(["b", "a"]);
    expect(fotos.filter((f) => f.esPortada).map((f) => f.id)).toEqual(["b"]);
    expect(deps.fotos.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("lanza FotoNoEncontradaError si la foto no pertenece a la galería", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, dos());
    const uc = new DefinirPortadaUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "p-1", fotoId: "x" }),
    ).rejects.toBeInstanceOf(FotoNoEncontradaError);
    expect(deps.fotos.sincronizar).not.toHaveBeenCalled();
  });
});
