import { describe, expect, it } from "vitest";
import {
  construirUrlEmbedMapaAdmin,
  estaMapaConfigurado,
  parsearLatitud,
  parsearLongitud,
} from "./maps";

describe("maps (ADR-011 — degradación del mapa del panel)", () => {
  describe("estaMapaConfigurado", () => {
    it("false sin API key", () => {
      expect(estaMapaConfigurado(undefined)).toBe(false);
      expect(estaMapaConfigurado("")).toBe(false);
      expect(estaMapaConfigurado("   ")).toBe(false);
    });

    it("true con API key no vacía", () => {
      expect(estaMapaConfigurado("clave-real")).toBe(true);
    });
  });

  describe("construirUrlEmbedMapaAdmin", () => {
    const coordenadas = { latitud: 5.3378, longitud: -72.3959 };

    it("null sin coordenadas", () => {
      expect(construirUrlEmbedMapaAdmin(null, "clave")).toBeNull();
    });

    it("null sin API key aunque haya coordenadas", () => {
      expect(construirUrlEmbedMapaAdmin(coordenadas, undefined)).toBeNull();
    });

    it("arma la URL del embed con key y center cuando ambos están presentes", () => {
      const url = construirUrlEmbedMapaAdmin(coordenadas, "clave-real");
      expect(url).toContain("https://www.google.com/maps/embed/v1/view");
      expect(url).toContain("key=clave-real");
      expect(url).toContain(`center=${coordenadas.latitud}%2C${coordenadas.longitud}`);
    });
  });

  describe("parsearLatitud / parsearLongitud", () => {
    it("acepta valores en rango", () => {
      expect(parsearLatitud("5.3378")).toBeCloseTo(5.3378);
      expect(parsearLongitud("-72.3959")).toBeCloseTo(-72.3959);
    });

    it("rechaza fuera de rango", () => {
      expect(parsearLatitud("91")).toBeNull();
      expect(parsearLongitud("-181")).toBeNull();
    });

    it("vacío es null (ubicación opcional, ADR-011)", () => {
      expect(parsearLatitud("")).toBeNull();
    });

    it("rechaza texto no numérico", () => {
      expect(parsearLatitud("abc")).toBeNull();
    });
  });
});
