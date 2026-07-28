import { describe, expect, it } from "vitest";
import {
  construirHrefCatalogoSegmento,
  construirHrefFicha,
  encontrarCiudadPorSegmento,
  esOperacionValida,
  normalizarSegmentoCiudad,
  resolverSegmentoPropiedades,
} from "./rutas";

describe("esOperacionValida", () => {
  it("acepta 'arriendo' y 'venta'", () => {
    expect(esOperacionValida("arriendo")).toBe(true);
    expect(esOperacionValida("venta")).toBe(true);
  });

  it("rechaza cualquier otro valor, incluido undefined", () => {
    expect(esOperacionValida("alquiler")).toBe(false);
    expect(esOperacionValida("")).toBe(false);
    expect(esOperacionValida(undefined)).toBe(false);
  });
});

describe("normalizarSegmentoCiudad", () => {
  it("pasa a minúsculas", () => {
    expect(normalizarSegmentoCiudad("Yopal")).toBe("yopal");
    expect(normalizarSegmentoCiudad("AGUAZUL")).toBe("aguazul");
  });

  it("quita tildes/diacríticos", () => {
    expect(normalizarSegmentoCiudad("Bogotá")).toBe("bogota");
    expect(normalizarSegmentoCiudad("Medellín")).toBe("medellin");
  });

  it("colapsa espacios a guiones y recorta bordes", () => {
    expect(normalizarSegmentoCiudad("  San José  ")).toBe("san-jose");
    expect(normalizarSegmentoCiudad("Puerto  López")).toBe("puerto-lopez");
  });
});

describe("encontrarCiudadPorSegmento", () => {
  const ciudades = [
    { ciudad: "Yopal", total: 12 },
    { ciudad: "Aguazul", total: 4 },
  ];

  it("matchea el segmento en minúsculas contra el nombre de ciudad (mayúscula inicial)", () => {
    expect(encontrarCiudadPorSegmento(ciudades, "yopal")).toEqual({ ciudad: "Yopal", total: 12 });
    expect(encontrarCiudadPorSegmento(ciudades, "aguazul")).toEqual({ ciudad: "Aguazul", total: 4 });
  });

  it("no matchea un segmento que no es ninguna ciudad conocida", () => {
    expect(encontrarCiudadPorSegmento(ciudades, "ap-001-apartamento-yopal")).toBeUndefined();
  });

  it("devuelve undefined cuando la lista de ciudades está vacía (degradación graciosa)", () => {
    expect(encontrarCiudadPorSegmento([], "yopal")).toBeUndefined();
  });
});

describe("construirHrefCatalogoSegmento", () => {
  it("construye la ruta canónica operación/ciudad en minúsculas", () => {
    expect(construirHrefCatalogoSegmento("arriendo", "Yopal")).toBe("/propiedades/arriendo/yopal");
    expect(construirHrefCatalogoSegmento("venta", "Aguazul")).toBe("/propiedades/venta/aguazul");
  });
});

describe("construirHrefFicha", () => {
  it("construye la ruta canónica operación/slug sin transformar el slug", () => {
    expect(construirHrefFicha("arriendo", "ap-001-apartamento-moderno-yopal")).toBe(
      "/propiedades/arriendo/ap-001-apartamento-moderno-yopal",
    );
  });
});

describe("resolverSegmentoPropiedades", () => {
  const ciudades = [
    { ciudad: "Yopal", total: 12 },
    { ciudad: "Aguazul", total: 4 },
  ];

  it("resuelve 'invalido' cuando la operación no está en el enum", () => {
    expect(resolverSegmentoPropiedades("alquiler", "yopal", ciudades)).toEqual({ tipo: "invalido" });
  });

  it("resuelve 'catalogo' cuando el segmento matchea una ciudad conocida", () => {
    expect(resolverSegmentoPropiedades("arriendo", "yopal", ciudades)).toEqual({
      tipo: "catalogo",
      operacion: "arriendo",
      ciudad: "Yopal",
    });
  });

  it("resuelve 'catalogo' con el segmento sin tildes/mayúsculas también matcheando", () => {
    expect(resolverSegmentoPropiedades("venta", "AGUAZUL", ciudades)).toEqual({
      tipo: "catalogo",
      operacion: "venta",
      ciudad: "Aguazul",
    });
  });

  it("resuelve 'ficha' (slug) cuando el segmento no matchea ninguna ciudad", () => {
    expect(resolverSegmentoPropiedades("arriendo", "ap-001-apartamento-moderno-yopal", ciudades)).toEqual({
      tipo: "ficha",
      operacion: "arriendo",
      slug: "ap-001-apartamento-moderno-yopal",
    });
  });

  it("resuelve 'ficha' cuando no hay ciudades conocidas (degradación graciosa de listarCiudades)", () => {
    expect(resolverSegmentoPropiedades("arriendo", "yopal", [])).toEqual({
      tipo: "ficha",
      operacion: "arriendo",
      slug: "yopal",
    });
  });

  it("operación inválida gana sobre cualquier segmento, aunque matchee una ciudad", () => {
    expect(resolverSegmentoPropiedades("alquiler", "yopal", ciudades)).toEqual({ tipo: "invalido" });
  });
});
