import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditarPropiedadUseCase, type EditarPropiedadInput } from "./editar-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
  TipoPropiedadInvalidoError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const TIPO_ACTIVO = CatalogoItem.reconstituir({
  id: "tipo-1", nombre: "Apartamento", activo: true, orden: 1, createdAt: AHORA, updatedAt: AHORA,
});

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
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn().mockResolvedValue(propiedad),
    listar: vi.fn(),
    cambiarEstado: vi.fn(),
  };
  const tipos: CatalogoRepositoryPort = {
    listar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(TIPO_ACTIVO), buscarPorNombre: vi.fn(),
    guardar: vi.fn(), existenActivos: vi.fn(),
  };
  const amenidades: CatalogoRepositoryPort = {
    listar: vi.fn(), buscarPorId: vi.fn(), buscarPorNombre: vi.fn(), guardar: vi.fn(),
    existenActivos: vi.fn().mockResolvedValue(true),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, tipos, amenidades, reloj };
}

function input(over: Partial<EditarPropiedadInput> = {}): EditarPropiedadInput {
  return {
    actor: { id: "agente-1", rol: "agente" }, id: "prop-1", titulo: "Casa editada", descripcion: "d2",
    tipoOperacion: "venta", tipoPropiedadId: "tipo-1", ciudad: "Medellín", barrio: "b2", direccion: null,
    precio: 2_000_000, area: 80, habitaciones: 2, banos: 2, estrato: null, parqueaderos: null,
    destacada: false, agenteId: null, amenidades: [], ...over,
  };
}

describe("EditarPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const deps = buildDeps(null);
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    await expect(uc.ejecutar(input())).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño (RN-010)", async () => {
    const deps = buildDeps(propiedadDe("otro-agente"));
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    await expect(uc.ejecutar(input({ actor: { id: "agente-1", rol: "agente" } }))).rejects.toBeInstanceOf(
      SinPermisoPropiedadError,
    );
    expect(deps.propiedades.guardar).not.toHaveBeenCalled();
  });

  it("lanza TipoPropiedadInvalidoError si el tipo es inválido", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    vi.mocked(deps.tipos.buscarPorId).mockResolvedValue(null);
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    await expect(uc.ejecutar(input())).rejects.toBeInstanceOf(TipoPropiedadInvalidoError);
  });

  it("edita y persiste cuando el Agente es el dueño", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    const p = await uc.ejecutar(input({ titulo: "Nuevo" }));
    expect(p.toProps().titulo).toBe("Nuevo");
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });

  it("el Agente no reasigna el agente responsable (RN-016)", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    const p = await uc.ejecutar(input({ actor: { id: "agente-1", rol: "agente" }, agenteId: "agente-2" }));
    expect(p.agenteId).toBe("agente-1");
  });

  it("el Administrador sí reasigna el agente responsable (RN-016)", async () => {
    const deps = buildDeps(propiedadDe("agente-1"));
    const uc = new EditarPropiedadUseCase(deps.propiedades, deps.tipos, deps.amenidades, deps.reloj);
    const p = await uc.ejecutar(input({ actor: { id: "u-admin", rol: "administrador" }, agenteId: "agente-2" }));
    expect(p.agenteId).toBe("agente-2");
  });
});
