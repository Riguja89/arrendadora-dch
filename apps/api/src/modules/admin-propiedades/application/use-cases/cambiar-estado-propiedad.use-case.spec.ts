import { describe, expect, it, vi } from "vitest";
import { CambiarEstadoPropiedadUseCase } from "./cambiar-estado-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import { HistorialEstado } from "../../domain/entities/historial-estado.entity";
import {
  PropiedadNoEncontradaError,
  ReaperturaSoloAdministradorError,
  SinPermisoPropiedadError,
  TransicionEstadoInvalidaError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
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
    guardar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(propiedad), listar: vi.fn(),
    cambiarEstado: vi.fn().mockResolvedValue(undefined),
  };
  const idGenerator: IdGeneratorPort = { nuevo: vi.fn().mockReturnValue("hist-uuid-1") };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, idGenerator, reloj };
}

function ucDe(deps: ReturnType<typeof buildDeps>): CambiarEstadoPropiedadUseCase {
  return new CambiarEstadoPropiedadUseCase(deps.propiedades, deps.idGenerator, deps.reloj);
}

describe("CambiarEstadoPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const deps = buildDeps(null);
    await expect(
      ucDe(deps).ejecutar({ actor: { id: "u-1", rol: "administrador" }, id: "x", estadoNuevo: "reservada", nota: null }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps(propiedadDe("otro"));
    await expect(
      ucDe(deps).ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1", estadoNuevo: "reservada", nota: null }),
    ).rejects.toBeInstanceOf(SinPermisoPropiedadError);
  });

  it("aplica la transición válida y persiste estado + historial en una sola llamada (ADR-006/DEI-001)", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const p = await ucDe(deps).ejecutar({
      actor: { id: "agente-1", rol: "agente" }, id: "prop-1", estadoNuevo: "reservada", nota: "Separada",
    });
    expect(p.estado).toBe("reservada");
    expect(deps.propiedades.cambiarEstado).toHaveBeenCalledTimes(1);
    const [, historial] = vi.mocked(deps.propiedades.cambiarEstado).mock.calls[0];
    expect(historial).toBeInstanceOf(HistorialEstado);
    expect(historial.toProps()).toMatchObject({
      estadoAnterior: "disponible", estadoNuevo: "reservada", usuarioId: "agente-1", nota: "Separada",
    });
  });

  it("propaga TransicionEstadoInvalidaError del aggregate (RN-012)", async () => {
    const propiedad = propiedadDe("agente-1");
    propiedad.cambiarEstado("arrendada_vendida", "agente", AHORA);
    const deps = buildDeps(propiedad);
    await expect(
      ucDe(deps).ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1", estadoNuevo: "reservada", nota: null }),
    ).rejects.toBeInstanceOf(TransicionEstadoInvalidaError);
    expect(deps.propiedades.cambiarEstado).not.toHaveBeenCalled();
  });

  it("propaga ReaperturaSoloAdministradorError cuando un Agente intenta reabrir (RN-012)", async () => {
    const propiedad = propiedadDe("agente-1");
    propiedad.cambiarEstado("arrendada_vendida", "agente", AHORA);
    const deps = buildDeps(propiedad);
    await expect(
      ucDe(deps).ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1", estadoNuevo: "disponible", nota: null }),
    ).rejects.toBeInstanceOf(ReaperturaSoloAdministradorError);
  });
});
