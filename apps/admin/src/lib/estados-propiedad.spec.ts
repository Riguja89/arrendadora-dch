import { describe, expect, it } from "vitest";
import {
  ETIQUETAS_ESTADO,
  mensajeConfirmacion,
  requiereConfirmacion,
  transicionesPermitidas,
} from "./estados-propiedad";

/** Máquina de estados RN-012 / ADR-006 — transiciones válidas y su gate por rol (ADR-014). */
describe("estados-propiedad", () => {
  describe("transicionesPermitidas", () => {
    it("disponible → [reservada, arrendada_vendida] para cualquier rol", () => {
      expect(transicionesPermitidas("disponible", "agente")).toEqual(["reservada", "arrendada_vendida"]);
      expect(transicionesPermitidas("disponible", "administrador")).toEqual(["reservada", "arrendada_vendida"]);
      expect(transicionesPermitidas("disponible", "editor")).toEqual(["reservada", "arrendada_vendida"]);
    });

    it("reservada → [disponible, arrendada_vendida] para cualquier rol", () => {
      expect(transicionesPermitidas("reservada", "agente")).toEqual(["disponible", "arrendada_vendida"]);
    });

    it("arrendada_vendida → [disponible] SOLO para administrador", () => {
      expect(transicionesPermitidas("arrendada_vendida", "administrador")).toEqual(["disponible"]);
      expect(transicionesPermitidas("arrendada_vendida", "agente")).toEqual([]);
      expect(transicionesPermitidas("arrendada_vendida", "editor")).toEqual([]);
      expect(transicionesPermitidas("arrendada_vendida", null)).toEqual([]);
    });
  });

  describe("requiereConfirmacion", () => {
    it("requiere confirmación al pasar a arrendada_vendida", () => {
      expect(requiereConfirmacion("disponible", "arrendada_vendida")).toBe(true);
      expect(requiereConfirmacion("reservada", "arrendada_vendida")).toBe(true);
    });

    it("requiere confirmación en la restauración excepcional arrendada_vendida → disponible", () => {
      expect(requiereConfirmacion("arrendada_vendida", "disponible")).toBe(true);
    });

    it("no requiere confirmación en disponible ↔ reservada", () => {
      expect(requiereConfirmacion("disponible", "reservada")).toBe(false);
      expect(requiereConfirmacion("reservada", "disponible")).toBe(false);
    });
  });

  describe("mensajeConfirmacion", () => {
    it("usa el texto literal de spec-003 para la transición terminal", () => {
      expect(mensajeConfirmacion("reservada", "arrendada_vendida")).toBe(
        "Esta acción marcará la propiedad como entregada. ¿Deseás confirmar?",
      );
    });

    it("usa un mensaje distinto para la restauración excepcional", () => {
      const mensaje = mensajeConfirmacion("arrendada_vendida", "disponible");
      expect(mensaje).toMatch(/excepcional/i);
    });
  });

  describe("ETIQUETAS_ESTADO", () => {
    it("tiene una etiqueta en español para cada estado del enum", () => {
      expect(ETIQUETAS_ESTADO.disponible).toBe("Disponible");
      expect(ETIQUETAS_ESTADO.reservada).toBe("Reservada");
      expect(ETIQUETAS_ESTADO.arrendada_vendida).toBe("Arrendada / Vendida");
    });
  });
});
