import { describe, expect, it } from "vitest";
import { Coordenadas } from "./coordenadas.vo";
import { CoordenadasInvalidasError } from "../errors/dominio-propiedades.errors";

/** RN-033 / ADR-011 — par latitud/longitud dentro del rango geográfico válido. */
describe("Coordenadas (VO)", () => {
  it("acepta coordenadas válidas y expone latitud/longitud", () => {
    const c = Coordenadas.crear(4.710989, -74.072092);
    expect(c.latitud).toBe(4.710989);
    expect(c.longitud).toBe(-74.072092);
  });

  it("acepta los extremos válidos (-90/90, -180/180)", () => {
    expect(Coordenadas.crear(90, 180).latitud).toBe(90);
    expect(Coordenadas.crear(-90, -180).longitud).toBe(-180);
  });

  it("rechaza latitud fuera de rango (> 90)", () => {
    expect(() => Coordenadas.crear(91, 0)).toThrow(CoordenadasInvalidasError);
  });

  it("rechaza latitud fuera de rango (< -90)", () => {
    expect(() => Coordenadas.crear(-91, 0)).toThrow(CoordenadasInvalidasError);
  });

  it("rechaza longitud fuera de rango (> 180)", () => {
    expect(() => Coordenadas.crear(0, 181)).toThrow(CoordenadasInvalidasError);
  });

  it("rechaza longitud fuera de rango (< -180)", () => {
    expect(() => Coordenadas.crear(0, -181)).toThrow(CoordenadasInvalidasError);
  });

  it("rechaza NaN", () => {
    expect(() => Coordenadas.crear(NaN, 0)).toThrow(CoordenadasInvalidasError);
  });
});
