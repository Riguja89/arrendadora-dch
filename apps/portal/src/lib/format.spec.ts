import { describe, expect, it } from "vitest";
import { formatearPrecioCOP, parseEnteroPositivo, parsePagina } from "./format";

describe("formatearPrecioCOP (RN-001)", () => {
  it("formatea con signo pesos, espacio y punto como separador de miles", () => {
    expect(formatearPrecioCOP(1_500_000)).toBe("$ 1.500.000");
  });

  it("formatea montos de más de un millón con varios separadores", () => {
    expect(formatearPrecioCOP(285_000_000)).toBe("$ 285.000.000");
  });

  it("formatea montos menores a mil sin separador", () => {
    expect(formatearPrecioCOP(500)).toBe("$ 500");
  });

  it("redondea decimales antes de formatear", () => {
    expect(formatearPrecioCOP(1_600_000.6)).toBe("$ 1.600.001");
  });
});

describe("parseEnteroPositivo", () => {
  it("parsea un string numérico válido", () => {
    expect(parseEnteroPositivo("1500000")).toBe(1_500_000);
  });

  it("devuelve undefined para undefined", () => {
    expect(parseEnteroPositivo(undefined)).toBeUndefined();
  });

  it("devuelve undefined para strings no numéricos", () => {
    expect(parseEnteroPositivo("abc")).toBeUndefined();
  });

  it("devuelve undefined para negativos", () => {
    expect(parseEnteroPositivo("-5")).toBeUndefined();
  });
});

describe("parsePagina", () => {
  it("devuelve 1 por defecto cuando no hay valor", () => {
    expect(parsePagina(undefined)).toBe(1);
  });

  it("devuelve 1 cuando el valor no es válido", () => {
    expect(parsePagina("abc")).toBe(1);
    expect(parsePagina("0")).toBe(1);
  });

  it("devuelve la página parseada cuando es válida", () => {
    expect(parsePagina("3")).toBe(3);
  });
});
