import { describe, expect, it } from "vitest";
import {
  esTransicionValida,
  requiereAdministrador,
  transicionesDisponibles,
} from "./transiciones-estado";

/** RN-012 — máquina de estados de la propiedad (ADR-006). */
describe("transiciones-estado", () => {
  describe("esTransicionValida", () => {
    it.each([
      ["disponible", "reservada"],
      ["disponible", "arrendada_vendida"],
      ["reservada", "disponible"],
      ["reservada", "arrendada_vendida"],
      ["arrendada_vendida", "disponible"],
    ] as const)("permite %s → %s", (desde, hacia) => {
      expect(esTransicionValida(desde, hacia)).toBe(true);
    });

    it("rechaza arrendada_vendida → reservada (estado terminal, HU-002 escenario 2)", () => {
      expect(esTransicionValida("arrendada_vendida", "reservada")).toBe(false);
    });

    it.each(["disponible", "reservada", "arrendada_vendida"] as const)(
      "rechaza la transición a sí mismo (%s → %s)",
      (estado) => {
        expect(esTransicionValida(estado, estado)).toBe(false);
      },
    );
  });

  describe("requiereAdministrador", () => {
    it("la reapertura arrendada_vendida → disponible es exclusiva del Administrador", () => {
      expect(requiereAdministrador("arrendada_vendida", "disponible")).toBe(true);
    });

    it("las demás transiciones no exigen Administrador", () => {
      expect(requiereAdministrador("disponible", "reservada")).toBe(false);
      expect(requiereAdministrador("reservada", "arrendada_vendida")).toBe(false);
    });
  });

  describe("transicionesDisponibles", () => {
    it("expone los estados alcanzables desde disponible", () => {
      expect(transicionesDisponibles("disponible")).toEqual(["reservada", "arrendada_vendida"]);
    });

    it("expone la única reapertura desde arrendada_vendida", () => {
      expect(transicionesDisponibles("arrendada_vendida")).toEqual(["disponible"]);
    });
  });
});
