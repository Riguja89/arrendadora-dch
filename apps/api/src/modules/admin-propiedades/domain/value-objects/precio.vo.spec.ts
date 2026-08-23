import { describe, expect, it } from "vitest";
import { Precio } from "./precio.vo";
import { PrecioInvalidoError } from "../errors/dominio-propiedades.errors";

/** RN-017 — precio entero positivo en COP, sin decimales. */
describe("Precio (VO)", () => {
  it("acepta un entero positivo y expone su valor", () => {
    expect(Precio.crear(1_500_000).valor).toBe(1_500_000);
  });

  it("acepta el mínimo válido (1)", () => {
    expect(Precio.crear(1).valor).toBe(1);
  });

  it("rechaza 0 (RN-017 — no publicable con precio 0)", () => {
    expect(() => Precio.crear(0)).toThrow(PrecioInvalidoError);
  });

  it("rechaza negativos", () => {
    expect(() => Precio.crear(-100)).toThrow(PrecioInvalidoError);
  });

  it("rechaza decimales", () => {
    expect(() => Precio.crear(1500.5)).toThrow(PrecioInvalidoError);
  });

  it("rechaza NaN", () => {
    expect(() => Precio.crear(Number.NaN)).toThrow(PrecioInvalidoError);
  });
});
