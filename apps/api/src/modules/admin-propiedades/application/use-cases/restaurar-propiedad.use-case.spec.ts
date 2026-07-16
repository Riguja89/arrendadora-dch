import { describe, expect, it, vi } from "vitest";
import { RestaurarPropiedadUseCase } from "./restaurar-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import { PropiedadNoEncontradaError } from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadArchivada(): Propiedad {
  const p = Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId: "agente-1", amenidades: [], ahora: AHORA,
  });
  p.archivar(AHORA);
  return p;
}

function buildDeps(propiedad: Propiedad | null) {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined), buscarPorId: vi.fn().mockResolvedValue(propiedad),
    listar: vi.fn(), cambiarEstado: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, reloj };
}

describe("RestaurarPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const deps = buildDeps(null);
    const uc = new RestaurarPropiedadUseCase(deps.propiedades, deps.reloj);
    await expect(uc.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, id: "x" })).rejects.toBeInstanceOf(
      PropiedadNoEncontradaError,
    );
  });

  it("restaura la propiedad archivada y persiste (RN-027)", async () => {
    const deps = buildDeps(propiedadArchivada());
    const uc = new RestaurarPropiedadUseCase(deps.propiedades, deps.reloj);
    const p = await uc.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, id: "prop-1" });
    expect(p.archivada).toBe(false);
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });
});
