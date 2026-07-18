import { describe, expect, it, vi } from "vitest";
import { ListarDestacadasUseCase } from "./listar-destacadas.use-case";
import type { EnriquecedorPortadasService } from "../services/enriquecedor-portadas.service";
import type { PropiedadCatalogoRepositoryPort } from "../../domain/ports/propiedad-catalogo.repository.port";
import type { PropiedadCatalogo } from "../../domain/read-models/propiedad-catalogo.read-model";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedad(id: string, destacada = false): PropiedadCatalogo {
  return {
    id,
    codigo: `AP-${id}`,
    titulo: `Propiedad ${id}`,
    slug: `apartamento-${id}`,
    tipoOperacion: "arriendo",
    tipoPropiedadNombre: "Apartamento",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    precio: 2_000_000,
    area: 60,
    habitaciones: 2,
    banos: 1,
    estado: "disponible",
    destacada,
    publicadaEn: AHORA,
    createdAt: AHORA,
  };
}

function buildDeps(destacadas: PropiedadCatalogo[], relleno: PropiedadCatalogo[]) {
  const propiedades = {
    buscar: vi.fn(),
    listarDestacadas: vi.fn().mockResolvedValue(destacadas),
    listarRecientesDisponibles: vi.fn().mockResolvedValue(relleno),
    listarTiposPropiedadActivos: vi.fn(),
    listarCiudadesConVisibles: vi.fn(),
  } as unknown as PropiedadCatalogoRepositoryPort;
  const enriquecedor = {
    resolverPortadas: vi
      .fn()
      .mockImplementation((ids: string[]) => Promise.resolve(new Map(ids.map((id) => [id, `p-${id}`])))),
  } as unknown as EnriquecedorPortadasService;
  return { propiedades, enriquecedor };
}

describe("ListarDestacadasUseCase", () => {
  it("devuelve solo las destacadas cuando ya hay 6, sin activar el fallback (RN-023)", async () => {
    const seis = ["1", "2", "3", "4", "5", "6"].map((id) => propiedad(id, true));
    const deps = buildDeps(seis, []);
    const uc = new ListarDestacadasUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar();

    expect(deps.propiedades.listarDestacadas).toHaveBeenCalledWith(6);
    expect(deps.propiedades.listarRecientesDisponibles).not.toHaveBeenCalled();
    expect(resultado).toHaveLength(6);
  });

  it("completa con recientes disponibles cuando hay menos de 6 destacadas (RN-023, fallback 2a/2b)", async () => {
    const destacadas = [propiedad("d1", true), propiedad("d2", true)];
    const relleno = [propiedad("r1"), propiedad("r2"), propiedad("r3")];
    const deps = buildDeps(destacadas, relleno);
    const uc = new ListarDestacadasUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar();

    // Pide 4 faltantes y excluye los ids ya destacados para no duplicar tarjetas.
    expect(deps.propiedades.listarRecientesDisponibles).toHaveBeenCalledWith(4, ["d1", "d2"]);
    expect(resultado.map((t) => t.propiedad.id)).toEqual(["d1", "d2", "r1", "r2", "r3"]);
    expect(resultado[0].portadaUrl).toBe("p-d1");
  });

  it("devuelve lista vacía cuando no hay destacadas ni disponibles (excepción 2c)", async () => {
    const deps = buildDeps([], []);
    const uc = new ListarDestacadasUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar();

    expect(deps.propiedades.listarRecientesDisponibles).toHaveBeenCalledWith(6, []);
    expect(resultado).toEqual([]);
  });
});
