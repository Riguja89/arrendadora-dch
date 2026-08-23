import { describe, expect, it } from "vitest";
import { construirUrlEmbedMapa, estaMapaConfigurado } from "./maps";

const UBICACION = { latitud: 5.33, longitud: -72.4 };

describe("estaMapaConfigurado", () => {
  it("es false sin API key", () => {
    expect(estaMapaConfigurado(undefined)).toBe(false);
    expect(estaMapaConfigurado("")).toBe(false);
    expect(estaMapaConfigurado("   ")).toBe(false);
  });

  it("es true con una API key no vacía", () => {
    expect(estaMapaConfigurado("clave-123")).toBe(true);
  });
});

describe("construirUrlEmbedMapa (ADR-011 — mapa aproximado, degradación)", () => {
  it("devuelve null si falta la API key (degradación HU-001 escenario 4)", () => {
    expect(construirUrlEmbedMapa(UBICACION, undefined)).toBeNull();
  });

  it("devuelve null si la propiedad no tiene ubicación", () => {
    expect(construirUrlEmbedMapa(null, "clave-123")).toBeNull();
  });

  it("construye la URL de Google Maps Embed (modo place, con marcador) en la ubicación aproximada", () => {
    const url = construirUrlEmbedMapa(UBICACION, "clave-123");
    expect(url).not.toBeNull();
    expect(url).toContain("https://www.google.com/maps/embed/v1/place?");
    expect(url).toContain("key=clave-123");
    expect(url).toContain(`q=${encodeURIComponent("5.33,-72.4")}`);
    expect(url).toContain("zoom=15");
  });
});
