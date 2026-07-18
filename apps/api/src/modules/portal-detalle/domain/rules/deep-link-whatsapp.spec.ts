import { describe, expect, it } from "vitest";
import {
  construirDeepLinkWhatsapp,
  normalizarNumeroWhatsapp,
  resolverMensajeWhatsapp,
} from "./deep-link-whatsapp";

describe("deep-link-whatsapp", () => {
  describe("normalizarNumeroWhatsapp", () => {
    it("reduce el número a solo dígitos (sin +, espacios ni separadores) para wa.me", () => {
      expect(normalizarNumeroWhatsapp("+57 300 123 4567")).toBe("573001234567");
      expect(normalizarNumeroWhatsapp("(57) 300-123-4567")).toBe("573001234567");
    });
  });

  describe("resolverMensajeWhatsapp", () => {
    it("interpola el {codigo} en la plantilla (GAP-002, RN-004)", () => {
      const mensaje = resolverMensajeWhatsapp("Hola, me interesa la propiedad {codigo}.", "AP-001");
      expect(mensaje).toBe("Hola, me interesa la propiedad AP-001.");
    });

    it("reemplaza todas las apariciones del marcador", () => {
      expect(resolverMensajeWhatsapp("{codigo} — ref {codigo}", "AP-009")).toBe(
        "AP-009 — ref AP-009",
      );
    });

    it("antepone el código como fallback cuando la plantilla no tiene {codigo} (RN-004)", () => {
      expect(resolverMensajeWhatsapp("Hola, quiero información", "AP-002")).toBe(
        "Hola, quiero información AP-002",
      );
    });
  });

  describe("construirDeepLinkWhatsapp", () => {
    it("arma el deep link wa.me con número normalizado y mensaje URL-encodeado (ADR-012)", () => {
      const link = construirDeepLinkWhatsapp(
        "+57 300 123 4567",
        "Hola, estoy interesado en la propiedad {codigo}.",
        "AP-001",
      );
      expect(link).toBe(
        "https://wa.me/573001234567?text=Hola%2C%20estoy%20interesado%20en%20la%20propiedad%20AP-001.",
      );
    });
  });
});
