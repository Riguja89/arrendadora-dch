import { describe, expect, it, vi } from "vitest";
import { ListarTiposPropiedadUseCase } from "./listar-tipos-propiedad.use-case";
import { ListarCiudadesUseCase } from "./listar-ciudades.use-case";
import type { PropiedadCatalogoRepositoryPort } from "../../domain/ports/propiedad-catalogo.repository.port";

function buildRepo(overrides: Partial<PropiedadCatalogoRepositoryPort>): PropiedadCatalogoRepositoryPort {
  return {
    buscar: vi.fn(),
    listarDestacadas: vi.fn(),
    listarRecientesDisponibles: vi.fn(),
    listarTiposPropiedadActivos: vi.fn(),
    listarCiudadesConVisibles: vi.fn(),
    ...overrides,
  } as unknown as PropiedadCatalogoRepositoryPort;
}

describe("Catálogos de filtro (tipos-propiedad / ciudades)", () => {
  it("ListarTiposPropiedadUseCase devuelve los tipos activos del repositorio (ADR-005)", async () => {
    const tipos = [{ id: "t1", nombre: "Apartamento" }];
    const repo = buildRepo({ listarTiposPropiedadActivos: vi.fn().mockResolvedValue(tipos) });
    const uc = new ListarTiposPropiedadUseCase(repo);

    await expect(uc.ejecutar()).resolves.toEqual(tipos);
    expect(repo.listarTiposPropiedadActivos).toHaveBeenCalledTimes(1);
  });

  it("ListarCiudadesUseCase devuelve las ciudades con visibles y su conteo (GAP-002)", async () => {
    const ciudades = [
      { ciudad: "Bogotá", total: 12 },
      { ciudad: "Medellín", total: 4 },
    ];
    const repo = buildRepo({ listarCiudadesConVisibles: vi.fn().mockResolvedValue(ciudades) });
    const uc = new ListarCiudadesUseCase(repo);

    await expect(uc.ejecutar()).resolves.toEqual(ciudades);
    expect(repo.listarCiudadesConVisibles).toHaveBeenCalledTimes(1);
  });
});
