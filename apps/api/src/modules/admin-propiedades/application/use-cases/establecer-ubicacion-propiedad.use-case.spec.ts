import { describe, expect, it, vi } from "vitest";
import { EstablecerUbicacionPropiedadUseCase } from "./establecer-ubicacion-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import {
  CoordenadasInvalidasError,
  DireccionNoGeocodificableError,
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
  UbicacionModoInvalidoError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { GeocodingPort } from "../../domain/ports/geocoding.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadDe(over: { agenteId?: string | null; direccion?: string | null } = {}): Propiedad {
  const direccion = "direccion" in over ? (over.direccion ?? null) : "Calle 63 #10-20";
  return Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b",
    direccion, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId: over.agenteId ?? "agente-1", amenidades: [], ahora: AHORA,
  });
}

function buildDeps(propiedad: Propiedad | null, geocodingImpl?: GeocodingPort["geocodificar"]) {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn().mockResolvedValue(propiedad),
    listar: vi.fn(),
    cambiarEstado: vi.fn(),
  };
  const geocoding: GeocodingPort = {
    geocodificar: vi.fn(geocodingImpl ?? (async () => ({ encontrado: true, latitud: 4.7, longitud: -74.1 }))),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, geocoding, reloj };
}

const ADMIN = { id: "u-admin", rol: "administrador" as const };

describe("EstablecerUbicacionPropiedadUseCase (RN-033)", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const deps = buildDeps(null);
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({ actor: ADMIN, id: "x", latitud: 4.7, longitud: -74.1 }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño", async () => {
    const deps = buildDeps(propiedadDe({ agenteId: "otro" }));
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({
        actor: { id: "agente-1", rol: "agente" },
        id: "prop-1",
        latitud: 4.7,
        longitud: -74.1,
      }),
    ).rejects.toBeInstanceOf(SinPermisoPropiedadError);
  });

  it("modo manual: fija latitud/longitud y persiste", async () => {
    const deps = buildDeps(propiedadDe());
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    const p = await uc.ejecutar({ actor: ADMIN, id: "prop-1", latitud: 4.710989, longitud: -74.072092 });
    expect(p.latitud).toBe(4.710989);
    expect(p.longitud).toBe(-74.072092);
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
    expect(deps.geocoding.geocodificar).not.toHaveBeenCalled();
  });

  it("modo manual: rechaza coordenadas fuera de rango (CoordenadasInvalidasError)", async () => {
    const deps = buildDeps(propiedadDe());
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({ actor: ADMIN, id: "prop-1", latitud: 200, longitud: -74.1 }),
    ).rejects.toBeInstanceOf(CoordenadasInvalidasError);
    expect(deps.propiedades.guardar).not.toHaveBeenCalled();
  });

  it("modo geocodificar: consulta el GeocodingPort con la dirección y persiste el resultado", async () => {
    const deps = buildDeps(propiedadDe({ direccion: "Calle 63 #10-20" }), async (direccion) => {
      expect(direccion).toBe("Calle 63 #10-20");
      return { encontrado: true, latitud: 4.6, longitud: -74.05 };
    });
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    const p = await uc.ejecutar({ actor: ADMIN, id: "prop-1", geocodificarDireccion: true });
    expect(p.latitud).toBe(4.6);
    expect(p.longitud).toBe(-74.05);
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });

  it("modo geocodificar: 422 si el proveedor no encuentra la dirección (RN-033 excepción)", async () => {
    const deps = buildDeps(propiedadDe(), async () => ({ encontrado: false, latitud: null, longitud: null }));
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({ actor: ADMIN, id: "prop-1", geocodificarDireccion: true }),
    ).rejects.toBeInstanceOf(DireccionNoGeocodificableError);
    expect(deps.propiedades.guardar).not.toHaveBeenCalled();
  });

  it("modo geocodificar: 422 si la propiedad no tiene dirección", async () => {
    const deps = buildDeps(propiedadDe({ direccion: null }));
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({ actor: ADMIN, id: "prop-1", geocodificarDireccion: true }),
    ).rejects.toBeInstanceOf(DireccionNoGeocodificableError);
    expect(deps.geocoding.geocodificar).not.toHaveBeenCalled();
  });

  it("422 (UbicacionModoInvalidoError) si llegan ambos modos a la vez", async () => {
    const deps = buildDeps(propiedadDe());
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(
      uc.ejecutar({ actor: ADMIN, id: "prop-1", latitud: 4.7, longitud: -74.1, geocodificarDireccion: true }),
    ).rejects.toBeInstanceOf(UbicacionModoInvalidoError);
  });

  it("422 (UbicacionModoInvalidoError) si no llega ningún modo", async () => {
    const deps = buildDeps(propiedadDe());
    const uc = new EstablecerUbicacionPropiedadUseCase(deps.propiedades, deps.geocoding, deps.reloj);
    await expect(uc.ejecutar({ actor: ADMIN, id: "prop-1" })).rejects.toBeInstanceOf(UbicacionModoInvalidoError);
  });
});
