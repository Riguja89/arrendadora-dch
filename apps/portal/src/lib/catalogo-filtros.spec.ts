import { describe, expect, it } from "vitest";
import {
  construirRutaCatalogo,
  contarFiltrosActivos,
  hayFiltrosActivos,
  VALORES_FILTROS_VACIOS,
  valoresInicialesAEstado,
  type ValoresFiltrosCatalogo,
} from "./catalogo-filtros";

/**
 * Unit tests de la lógica pura de filtros del catálogo (BUILD-041 DoD §8.4):
 * conteo de filtros activos, adaptador de valores iniciales, construcción de
 * URL. Sin dependencias de React ni del DOM — se ejecutan en el `environment:
 * node` que ya usa el resto del portal.
 */
describe("contarFiltrosActivos", () => {
  it("devuelve 0 cuando ningún campo tiene valor", () => {
    expect(contarFiltrosActivos(VALORES_FILTROS_VACIOS)).toBe(0);
    expect(hayFiltrosActivos(VALORES_FILTROS_VACIOS)).toBe(false);
  });

  it("cuenta cada campo con valor no vacío por separado", () => {
    const uno: ValoresFiltrosCatalogo = {
      ...VALORES_FILTROS_VACIOS,
      ciudad: "Yopal",
    };
    expect(contarFiltrosActivos(uno)).toBe(1);

    const tres: ValoresFiltrosCatalogo = {
      tipoOperacion: "arriendo",
      tipoPropiedad: "Apartamento",
      ciudad: "Yopal",
      precioMin: "",
      precioMax: "",
    };
    expect(contarFiltrosActivos(tres)).toBe(3);
  });

  it("suma los 5 campos cuando todos tienen valor", () => {
    const cinco: ValoresFiltrosCatalogo = {
      tipoOperacion: "venta",
      tipoPropiedad: "Casa",
      ciudad: "Aguazul",
      precioMin: "500000",
      precioMax: "3000000",
    };
    expect(contarFiltrosActivos(cinco)).toBe(5);
    expect(hayFiltrosActivos(cinco)).toBe(true);
  });

  it("ignora precios de valor '0' textual", () => {
    // '0' es truthy como string pero el use case del portal considera "sin filtro"
    // solo cuando la string está vacía — un usuario que teclea "0" sí está
    // aplicando un filtro (aunque no tenga efecto práctico). Guardamos el
    // contrato: solo la string vacía cuenta como sin valor.
    const conCero: ValoresFiltrosCatalogo = {
      ...VALORES_FILTROS_VACIOS,
      precioMin: "0",
    };
    expect(contarFiltrosActivos(conCero)).toBe(1);
  });
});

describe("valoresInicialesAEstado", () => {
  it("mapea un snapshot completo del server a strings del cliente", () => {
    expect(
      valoresInicialesAEstado({
        tipoOperacion: "arriendo",
        tipoPropiedad: "Apartamento",
        ciudad: "Yopal",
        precioMin: 1200000,
        precioMax: 3500000,
      }),
    ).toEqual<ValoresFiltrosCatalogo>({
      tipoOperacion: "arriendo",
      tipoPropiedad: "Apartamento",
      ciudad: "Yopal",
      precioMin: "1200000",
      precioMax: "3500000",
    });
  });

  it("convierte undefined a string vacía sin perder integridad", () => {
    expect(valoresInicialesAEstado({})).toEqual(VALORES_FILTROS_VACIOS);
  });
});

describe("construirRutaCatalogo", () => {
  it("devuelve `/` cuando no hay filtros", () => {
    expect(construirRutaCatalogo(VALORES_FILTROS_VACIOS)).toBe("/");
  });

  it("usa query params en la home cuando falta operación o ciudad", () => {
    expect(
      construirRutaCatalogo({
        ...VALORES_FILTROS_VACIOS,
        tipoPropiedad: "Apartamento",
        precioMin: "800000",
      }),
    ).toBe("/?tipo_propiedad=Apartamento&precio_min=800000");
  });

  it("navega a la ruta canónica cuando hay operación + ciudad", () => {
    expect(
      construirRutaCatalogo({
        tipoOperacion: "arriendo",
        tipoPropiedad: "",
        ciudad: "Yopal",
        precioMin: "",
        precioMax: "",
      }),
    ).toBe("/propiedades/arriendo/yopal");
  });

  it("agrega los filtros restantes como query params sobre la ruta canónica", () => {
    expect(
      construirRutaCatalogo({
        tipoOperacion: "venta",
        tipoPropiedad: "Casa",
        ciudad: "Aguazul",
        precioMin: "500000",
        precioMax: "3000000",
      }),
    ).toBe(
      "/propiedades/venta/aguazul?tipo_propiedad=Casa&precio_min=500000&precio_max=3000000",
    );
  });

  it("normaliza el segmento de ciudad (mayúsculas y tildes) a minúsculas sin tildes", () => {
    // Aunque el catálogo actual no tiene ciudades con tilde, el contrato de
    // normalización sí debe respetarse — cualquier futura ciudad con tilde debe
    // producir un segmento URL-safe.
    expect(
      construirRutaCatalogo({
        tipoOperacion: "arriendo",
        tipoPropiedad: "",
        ciudad: "Bogotá",
        precioMin: "",
        precioMax: "",
      }),
    ).toBe("/propiedades/arriendo/bogota");
  });
});
