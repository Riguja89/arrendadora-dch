import { beforeEach, describe, expect, it, vi } from "vitest";
import { peticionApi } from "@/lib/http-client";
import {
  aPropiedadResumen,
  buscarPropiedades,
  construirQueryCatalogo,
  listarCiudades,
  listarDestacadas,
  listarTiposPropiedad,
  type PropiedadResumenWire,
} from "./catalogo";

vi.mock("@/lib/http-client", () => ({
  peticionApi: vi.fn(),
}));

const peticionApiMock = vi.mocked(peticionApi);

const PROPIEDAD_WIRE: PropiedadResumenWire = {
  codigo: "AP-001",
  titulo: "Apartamento moderno cerca al centro de Yopal",
  slug: "ap-001-apartamento-moderno-yopal",
  tipo_operacion: "arriendo",
  tipo_propiedad: "Apartamento",
  ciudad: "Yopal",
  barrio: "La Campiña",
  precio: 1_600_000,
  area: 68,
  habitaciones: 3,
  banos: 2,
  estado: "disponible",
  badge_reservada: false,
  portada_url: "https://cdn.example.com/ap-001.jpg",
};

describe("aPropiedadResumen", () => {
  it("mapea el wire snake_case al modelo de dominio camelCase", () => {
    expect(aPropiedadResumen(PROPIEDAD_WIRE)).toEqual({
      codigo: "AP-001",
      titulo: "Apartamento moderno cerca al centro de Yopal",
      slug: "ap-001-apartamento-moderno-yopal",
      tipoOperacion: "arriendo",
      tipoPropiedad: "Apartamento",
      ciudad: "Yopal",
      barrio: "La Campiña",
      precio: 1_600_000,
      area: 68,
      habitaciones: 3,
      banos: 2,
      estado: "disponible",
      badgeReservada: false,
      portadaUrl: "https://cdn.example.com/ap-001.jpg",
    });
  });
});

describe("construirQueryCatalogo", () => {
  it("no agrega ningún parámetro cuando no hay filtros", () => {
    expect(construirQueryCatalogo({})).toBe("");
  });

  it("usa los nombres snake_case exactos del contrato DESIGN-029", () => {
    const query = construirQueryCatalogo({
      tipoOperacion: "arriendo",
      tipoPropiedad: "Apartamento",
      ciudad: "Yopal",
      precioMin: 500_000,
      precioMax: 2_000_000,
      pagina: 2,
    });

    const params = new URLSearchParams(query.slice(1));
    expect(params.get("tipo_operacion")).toBe("arriendo");
    expect(params.get("tipo_propiedad")).toBe("Apartamento");
    expect(params.get("ciudad")).toBe("Yopal");
    expect(params.get("precio_min")).toBe("500000");
    expect(params.get("precio_max")).toBe("2000000");
    expect(params.get("pagina")).toBe("2");
  });

  it("omite `pagina` cuando es 1 (default del contrato)", () => {
    expect(construirQueryCatalogo({ pagina: 1 })).toBe("");
  });
});

describe("buscarPropiedades", () => {
  beforeEach(() => {
    peticionApiMock.mockReset();
  });

  it("mapea la respuesta plana del contrato (sin envelope meta anidado) a { propiedades, meta }", async () => {
    peticionApiMock.mockResolvedValue({
      ok: true,
      data: {
        pagina: 1,
        tamano_pagina: 12,
        total: 1,
        total_paginas: 1,
        data: [PROPIEDAD_WIRE],
      },
    });

    const resultado = await buscarPropiedades({ ciudad: "Yopal" });

    expect(peticionApiMock).toHaveBeenCalledWith("/public/propiedades?ciudad=Yopal");
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.data.propiedades).toHaveLength(1);
      expect(resultado.data.propiedades[0]?.tipoOperacion).toBe("arriendo");
      expect(resultado.data.meta).toEqual({
        pagina: 1,
        tamanoPagina: 12,
        total: 1,
        totalPaginas: 1,
      });
    }
  });

  it("propaga el error tal cual cuando peticionApi falla", async () => {
    peticionApiMock.mockResolvedValue({
      ok: false,
      error: {
        error: "SERVICE_UNAVAILABLE",
        message: "No pudimos conectar con el servicio.",
        correlation_id: "id-1",
      },
    });

    const resultado = await buscarPropiedades();
    expect(resultado.ok).toBe(false);
  });
});

describe("listarDestacadas", () => {
  beforeEach(() => {
    peticionApiMock.mockReset();
  });

  it("mapea el array de propiedades destacadas", async () => {
    peticionApiMock.mockResolvedValue({ ok: true, data: [PROPIEDAD_WIRE] });

    const resultado = await listarDestacadas();

    expect(peticionApiMock).toHaveBeenCalledWith("/public/destacadas");
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.data).toHaveLength(1);
      expect(resultado.data[0]?.badgeReservada).toBe(false);
    }
  });
});

describe("listarTiposPropiedad / listarCiudades", () => {
  beforeEach(() => {
    peticionApiMock.mockReset();
  });

  it("listarTiposPropiedad llama al endpoint de referencia", async () => {
    peticionApiMock.mockResolvedValue({ ok: true, data: [{ id: "1", nombre: "Apartamento" }] });
    const resultado = await listarTiposPropiedad();
    expect(peticionApiMock).toHaveBeenCalledWith("/public/tipos-propiedad");
    expect(resultado).toEqual({ ok: true, data: [{ id: "1", nombre: "Apartamento" }] });
  });

  it("listarCiudades llama al endpoint de referencia", async () => {
    peticionApiMock.mockResolvedValue({ ok: true, data: [{ ciudad: "Yopal", total: 5 }] });
    const resultado = await listarCiudades();
    expect(peticionApiMock).toHaveBeenCalledWith("/public/ciudades");
    expect(resultado).toEqual({ ok: true, data: [{ ciudad: "Yopal", total: 5 }] });
  });
});
