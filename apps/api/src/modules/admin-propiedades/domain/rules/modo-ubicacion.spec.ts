import { describe, expect, it } from "vitest";
import { resolverModoUbicacion } from "./modo-ubicacion";
import { UbicacionModoInvalidoError } from "../errors/dominio-propiedades.errors";

/** RN-033 — exactamente un modo: manual (latitud+longitud) O geocodificar_direccion. */
describe("resolverModoUbicacion (RN-033)", () => {
  it("resuelve 'manual' cuando llegan latitud y longitud", () => {
    expect(resolverModoUbicacion({ latitud: 4.7, longitud: -74.1 })).toBe("manual");
  });

  it("resuelve 'geocodificar' cuando llega geocodificarDireccion: true", () => {
    expect(resolverModoUbicacion({ geocodificarDireccion: true })).toBe("geocodificar");
  });

  it("rechaza cuando llegan ambos modos a la vez", () => {
    expect(() => resolverModoUbicacion({ latitud: 4.7, longitud: -74.1, geocodificarDireccion: true })).toThrow(
      UbicacionModoInvalidoError,
    );
  });

  it("rechaza cuando no llega ningún modo", () => {
    expect(() => resolverModoUbicacion({})).toThrow(UbicacionModoInvalidoError);
  });

  it("rechaza cuando geocodificarDireccion es false y no hay coordenadas", () => {
    expect(() => resolverModoUbicacion({ geocodificarDireccion: false })).toThrow(UbicacionModoInvalidoError);
  });

  it("rechaza latitud sin longitud (manual parcial)", () => {
    expect(() => resolverModoUbicacion({ latitud: 4.7 })).toThrow(UbicacionModoInvalidoError);
  });

  it("rechaza longitud sin latitud (manual parcial)", () => {
    expect(() => resolverModoUbicacion({ longitud: -74.1 })).toThrow(UbicacionModoInvalidoError);
  });

  it("trata latitud/longitud null como ausentes", () => {
    expect(resolverModoUbicacion({ latitud: null, longitud: null, geocodificarDireccion: true })).toBe(
      "geocodificar",
    );
  });
});
