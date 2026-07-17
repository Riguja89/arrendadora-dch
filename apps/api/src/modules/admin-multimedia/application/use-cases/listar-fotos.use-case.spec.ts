import { describe, expect, it, vi } from "vitest";
import { ListarFotosUseCase } from "./listar-fotos.use-case";
import { Foto } from "../../domain/entities/foto.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import type { FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import type { PropiedadAccesoPort, PropiedadAcceso } from "../../domain/ports/propiedad-acceso.port";

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
  return { propiedades, fotos };
}

describe("ListarFotosUseCase", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const deps = buildDeps(null);
    const uc = new ListarFotosUseCase(deps.propiedades, deps.fotos);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "x" }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoMultimediaError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps({ agenteId: "otro", esVisible: true });
    const uc = new ListarFotosUseCase(deps.propiedades, deps.fotos);
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, propiedadId: "p-1" }),
    ).rejects.toBeInstanceOf(SinPermisoMultimediaError);
  });

  it("devuelve la galería ordenada con portada primero (orden contiguo)", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, [
      fotoPersistida("b", 2, false),
      fotoPersistida("a", 1, true),
    ]);
    const uc = new ListarFotosUseCase(deps.propiedades, deps.fotos);
    const fotos = await uc.ejecutar({ actor: { id: "u", rol: "editor" }, propiedadId: "p-1" });
    expect(fotos.map((f) => f.id)).toEqual(["a", "b"]);
    expect(fotos.map((f) => f.orden)).toEqual([1, 2]);
  });
});
