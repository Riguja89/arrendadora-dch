import { describe, expect, it } from "vitest";
import { Area } from "./area.vo";
import { AreaInvalidaError } from "../errors/dominio-propiedades.errors";

/** RN-018 — área entera positiva en metros cuadrados. */
describe("Area (VO)", () => {
  it("acepta un entero positivo y expone su valor", () => {
    expect(Area.crear(85).valor).toBe(85);
  });

  it("acepta el mínimo válido (1)", () => {
    expect(Area.crear(1).valor).toBe(1);
  });

  it("rechaza 0", () => {
    expect(() => Area.crear(0)).toThrow(AreaInvalidaError);
  });

  it("rechaza negativos", () => {
    expect(() => Area.crear(-5)).toThrow(AreaInvalidaError);
  });

  it("rechaza decimales", () => {
    expect(() => Area.crear(85.5)).toThrow(AreaInvalidaError);
  });
});
