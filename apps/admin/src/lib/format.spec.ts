import { describe, expect, it } from "vitest";
import { formatearFechaHora, formatearPrecioCOP } from "./format";

describe("formatearPrecioCOP", () => {
  it("formatea un entero como moneda COP sin decimales", () => {
    const resultado = formatearPrecioCOP(1500000);
    expect(resultado).toContain("1.500.000");
    expect(resultado).not.toMatch(/,\d{2}$/);
  });

  it("formatea cero", () => {
    expect(formatearPrecioCOP(0)).toContain("0");
  });
});

describe("formatearFechaHora", () => {
  it("formatea un ISO válido a fecha/hora corta", () => {
    const resultado = formatearFechaHora("2026-07-14T10:30:00.000Z");
    expect(resultado).not.toBe("2026-07-14T10:30:00.000Z");
    expect(resultado.length).toBeGreaterThan(0);
  });

  it("retorna el string original si no es un ISO válido", () => {
    expect(formatearFechaHora("no-es-fecha")).toBe("no-es-fecha");
  });
});
