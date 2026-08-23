import { describe, expect, it, vi } from "vitest";
import { ArchivarPropiedadUseCase } from "./archivar-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadDe(agenteId: string | null): Propiedad {
  return Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId, amenidades: [], ahora: AHORA,
  });
}

function buildDeps(propiedad: Propiedad | null) {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined), buscarPorId: vi.fn().mockResolvedValue(propiedad),
    listar: vi.fn(), cambiarEstado: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, reloj };
}

describe("ArchivarPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const deps = buildDeps(null);
    const uc = new ArchivarPropiedadUseCase(deps.propiedades, deps.reloj);
    await expect(uc.ejecutar({ actor: { id: "u-1", rol: "administrador" }, id: "x" })).rejects.toBeInstanceOf(
      PropiedadNoEncontradaError,
    );
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño", async () => {
    const deps = buildDeps(propiedadDe("otro"));
    const uc = new ArchivarPropiedadUseCase(deps.propiedades, deps.reloj);
    await expect(uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" })).rejects.toBeInstanceOf(
      SinPermisoPropiedadError,
    );
  });

  it("archiva y persiste (RN-027)", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const uc = new ArchivarPropiedadUseCase(deps.propiedades, deps.reloj);
    const p = await uc.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, id: "prop-1" });
    expect(p.archivada).toBe(true);
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });
});
