import { describe, expect, it, vi } from "vitest";
import { ReordenarFotosUseCase } from "./reordenar-fotos.use-case";
import { Foto } from "../../domain/entities/foto.entity";
import {
  OrdenFotosInvalidoError,
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

const tres = () => [
  fotoPersistida("a", 1, true),
  fotoPersistida("b", 2, false),
  fotoPersistida("c", 3, false),
];

describe("ReordenarFotosUseCase (CU-002 / RN-031)", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const deps = buildDeps(null);
    const uc = new ReordenarFotosUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "x", ordenIds: ["a"] }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoMultimediaError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps({ agenteId: "otro", esVisible: true }, tres());
    const uc = new ReordenarFotosUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, propiedadId: "p-1", ordenIds: ["c", "b", "a"] }),
    ).rejects.toBeInstanceOf(SinPermisoMultimediaError);
  });

  it("reordena, recalcula portada primero y persiste (RN-031)", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, tres());
    const uc = new ReordenarFotosUseCase(deps.propiedades, deps.fotos, deps.reloj);
    const fotos = await uc.ejecutar({ actor: { id: "u", rol: "editor" }, propiedadId: "p-1", ordenIds: ["c", "a", "b"] });
    expect(fotos.map((f) => f.id)).toEqual(["c", "a", "b"]);
    expect(fotos[0]!.esPortada).toBe(true);
    expect(deps.fotos.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("lanza OrdenFotosInvalidoError si el orden no coincide con las fotos actuales", async () => {
    const deps = buildDeps({ agenteId: null, esVisible: true }, tres());
    const uc = new ReordenarFotosUseCase(deps.propiedades, deps.fotos, deps.reloj);
    await expect(
      uc.ejecutar({ actor: { id: "u", rol: "administrador" }, propiedadId: "p-1", ordenIds: ["a", "b"] }),
    ).rejects.toBeInstanceOf(OrdenFotosInvalidoError);
    expect(deps.fotos.sincronizar).not.toHaveBeenCalled();
  });
});
