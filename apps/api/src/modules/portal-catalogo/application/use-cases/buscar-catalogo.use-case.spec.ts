import { describe, expect, it, vi } from "vitest";
import { BuscarCatalogoUseCase } from "./buscar-catalogo.use-case";
import type { EnriquecedorPortadasService } from "../services/enriquecedor-portadas.service";
import type {
  PropiedadCatalogoRepositoryPort,
  ResultadoBusquedaCatalogo,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import type { PropiedadCatalogo } from "../../domain/read-models/propiedad-catalogo.read-model";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedad(id: string): PropiedadCatalogo {
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
    destacada: false,
    publicadaEn: AHORA,
    createdAt: AHORA,
  };
}

function buildDeps(resultado: ResultadoBusquedaCatalogo, portadas: Map<string, string>) {
  const propiedades = {
    buscar: vi.fn().mockResolvedValue(resultado),
    listarDestacadas: vi.fn(),
    listarRecientesDisponibles: vi.fn(),
    listarTiposPropiedadActivos: vi.fn(),
    listarCiudadesConVisibles: vi.fn(),
  } as unknown as PropiedadCatalogoRepositoryPort;
  const enriquecedor = {
    resolverPortadas: vi.fn().mockResolvedValue(portadas),
  } as unknown as EnriquecedorPortadasService;
  return { propiedades, enriquecedor };
}

describe("BuscarCatalogoUseCase", () => {
  it("calcula el skip a partir de página y tamaño, y propaga los filtros al repositorio (RN-024)", async () => {
    const deps = buildDeps({ items: [propiedad("1")], total: 25 }, new Map([["1", "portada-1"]]));
    const uc = new BuscarCatalogoUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar({
      tipoOperacion: "venta",
      tipoPropiedad: "Casa",
      ciudad: "Medellín",
      barrio: "Laureles",
      q: "vista",
      precioMin: 100,
      precioMax: 500,
      pagina: 3,
      tamanoPagina: 12,
    });

    expect(deps.propiedades.buscar).toHaveBeenCalledWith({
      tipoOperacion: "venta",
      tipoPropiedad: "Casa",
      ciudad: "Medellín",
      barrio: "Laureles",
      q: "vista",
      precioMin: 100,
      precioMax: 500,
      skip: 24,
      take: 12,
    });
    expect(resultado.total).toBe(25);
    expect(resultado.pagina).toBe(3);
    expect(resultado.tamanoPagina).toBe(12);
  });

  it("enriquece cada tarjeta con la URL de portada resuelta (RN-014)", async () => {
    const deps = buildDeps(
      { items: [propiedad("a"), propiedad("b")], total: 2 },
      new Map([
        ["a", "https://cdn/a-card.jpg"],
        ["b", "https://cdn/generica.jpg"],
      ]),
    );
    const uc = new BuscarCatalogoUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar({ pagina: 1, tamanoPagina: 12 });

    expect(deps.enriquecedor.resolverPortadas).toHaveBeenCalledWith(["a", "b"]);
    expect(resultado.items).toHaveLength(2);
    expect(resultado.items[0]).toEqual({
      propiedad: propiedad("a"),
      portadaUrl: "https://cdn/a-card.jpg",
    });
    expect(resultado.items[1].portadaUrl).toBe("https://cdn/generica.jpg");
  });

  it("devuelve una lista vacía sin fallar cuando no hay resultados", async () => {
    const deps = buildDeps({ items: [], total: 0 }, new Map());
    const uc = new BuscarCatalogoUseCase(deps.propiedades, deps.enriquecedor);

    const resultado = await uc.ejecutar({ pagina: 1, tamanoPagina: 12 });

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });
});
