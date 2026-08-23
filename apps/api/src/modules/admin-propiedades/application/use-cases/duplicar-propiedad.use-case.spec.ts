import { describe, expect, it, vi } from "vitest";
import { DuplicarPropiedadUseCase } from "./duplicar-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { GeneradorCodigoPort } from "../../domain/ports/generador-codigo.port";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadDe(agenteId: string | null): Propiedad {
  const p = Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: true,
    agenteId, amenidades: [{ amenidadId: "am-1", cantidad: 1 }], ahora: AHORA,
  });
  p.cambiarEstado("reservada", "agente", AHORA);
  return p;
}

function buildDeps(propiedad: Propiedad | null) {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined), buscarPorId: vi.fn().mockResolvedValue(propiedad),
    listar: vi.fn(), cambiarEstado: vi.fn(),
  };
  const generadorCodigo: GeneradorCodigoPort = { siguiente: vi.fn().mockResolvedValue("AP-099") };
  const idGenerator: IdGeneratorPort = { nuevo: vi.fn().mockReturnValue("prop-copia") };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, generadorCodigo, idGenerator, reloj };
}

function ucDe(deps: ReturnType<typeof buildDeps>): DuplicarPropiedadUseCase {
  return new DuplicarPropiedadUseCase(deps.propiedades, deps.generadorCodigo, deps.idGenerator, deps.reloj);
}

describe("DuplicarPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si el original no existe", async () => {
    const deps = buildDeps(null);
    await expect(ucDe(deps).ejecutar({ actor: { id: "u-1", rol: "administrador" }, id: "x" })).rejects.toBeInstanceOf(
      PropiedadNoEncontradaError,
    );
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño del original", async () => {
    const deps = buildDeps(propiedadDe("otro"));
    await expect(ucDe(deps).ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" })).rejects.toBeInstanceOf(
      SinPermisoPropiedadError,
    );
  });

  it("crea copia disponible con nuevo código, a nombre del Agente que duplica (RN-026)", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const copia = await ucDe(deps).ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" });
    const props = copia.toProps();
    expect(props.id).toBe("prop-copia");
    expect(props.codigo).toBe("AP-099");
    expect(props.estado).toBe("disponible");
    expect(props.agenteId).toBe("agente-1");
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });

  it("el Administrador conserva el agente del original al duplicar", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const copia = await ucDe(deps).ejecutar({ actor: { id: "u-admin", rol: "administrador" }, id: "prop-1" });
    expect(copia.toProps().agenteId).toBe("agente-1");
  });
});
