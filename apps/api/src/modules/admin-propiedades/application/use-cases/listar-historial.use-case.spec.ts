import { describe, expect, it, vi } from "vitest";
import { ListarHistorialUseCase } from "./listar-historial.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type {
  HistorialEstadoLectura,
  HistorialEstadoRepositoryPort,
} from "../../domain/ports/historial-estado.repository.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadDe(agenteId: string | null): Propiedad {
  return Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId, amenidades: [], ahora: AHORA,
  });
}

const ENTRADA: HistorialEstadoLectura = {
  id: "h-1", estadoAnterior: "disponible", estadoNuevo: "reservada", usuarioId: "u-1",
  usuarioNombre: "Ana", nota: null, cambiadoEn: AHORA,
};

function buildDeps(propiedad: Propiedad | null) {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(propiedad), listar: vi.fn(), cambiarEstado: vi.fn(),
  };
  const historial: HistorialEstadoRepositoryPort = {
    listarPorPropiedad: vi.fn().mockResolvedValue([ENTRADA]),
  };
  return { propiedades, historial };
}

describe("ListarHistorialUseCase", () => {
  it("lanza PropiedadNoEncontradaError si la propiedad no existe", async () => {
    const deps = buildDeps(null);
    const uc = new ListarHistorialUseCase(deps.propiedades, deps.historial);
    await expect(uc.ejecutar({ actor: { id: "u-1", rol: "administrador" }, id: "x" })).rejects.toBeInstanceOf(
      PropiedadNoEncontradaError,
    );
    expect(deps.historial.listarPorPropiedad).not.toHaveBeenCalled();
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps(propiedadDe("otro"));
    const uc = new ListarHistorialUseCase(deps.propiedades, deps.historial);
    await expect(uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" })).rejects.toBeInstanceOf(
      SinPermisoPropiedadError,
    );
  });

  it("devuelve el historial de la propiedad cuando hay permiso", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const uc = new ListarHistorialUseCase(deps.propiedades, deps.historial);
    const res = await uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" });
    expect(res).toEqual([ENTRADA]);
    expect(deps.historial.listarPorPropiedad).toHaveBeenCalledWith("prop-1");
  });
});
