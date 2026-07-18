import { describe, expect, it } from "vitest";
import { aPropiedadDetalleWire } from "./detalle.mapper";
import type { FichaDetalle } from "../../../application/use-cases/obtener-ficha-por-slug.use-case";
import type { PropiedadDetalle } from "../../../domain/read-models/propiedad-detalle.read-model";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedad(overrides: Partial<PropiedadDetalle> = {}): PropiedadDetalle {
  return {
    id: "prop-1",
    codigo: "AP-001",
    titulo: "Apartamento en Chapinero",
    slug: "apartamento-chapinero",
    descripcion: "Amplio apartamento con vista.",
    tipoOperacion: "arriendo",
    tipoPropiedadNombre: "Apartamento",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    precio: 2_800_000,
    area: 75,
    habitaciones: 3,
    banos: 2,
    estrato: 4,
    parqueaderos: 1,
    estado: "disponible",
    latitud: 4.65,
    longitud: -74.06,
    amenidades: [{ nombre: "Gimnasio", cantidad: 1 }],
    ...overrides,
  };
}

function ficha(prop: PropiedadDetalle): FichaDetalle {
  return {
    propiedad: prop,
    galeria: [
      {
        id: "f1",
        orden: 1,
        esPortada: true,
        formatoOriginal: "jpg",
        urlOptimizada: "optimizada-f1",
        urlCard: "card-f1",
        urlThumbnail: "thumb-f1",
        createdAt: AHORA,
      },
    ],
    imagenOpenGraph: "optimizada-f1",
    urlPublica: "https://portal.co/propiedades/apartamento-chapinero",
  };
}

describe("aPropiedadDetalleWire", () => {
  it("mapea la ficha a snake_case exponiendo coordenadas aproximadas pero NUNCA la dirección (ADR-011)", () => {
    const wire = aPropiedadDetalleWire(ficha(propiedad()));

    expect(wire.ubicacion).toEqual({ latitud: 4.65, longitud: -74.06 });
    // Blindaje de privacidad: el wire no tiene ningún campo de dirección cruda.
    expect(Object.keys(wire)).not.toContain("direccion");
    expect(wire.tipo_propiedad).toBe("Apartamento");
    expect(wire.amenidades).toEqual([{ nombre: "Gimnasio", cantidad: 1 }]);
    expect(wire.galeria[0]).toEqual({
      url_optimizada: "optimizada-f1",
      url_card: "card-f1",
      url_thumbnail: "thumb-f1",
      es_portada: true,
    });
    expect(wire.open_graph).toEqual({
      titulo: "Apartamento en Chapinero",
      descripcion: "Amplio apartamento con vista.",
      imagen: "optimizada-f1",
      url: "https://portal.co/propiedades/apartamento-chapinero",
    });
  });

  it("marca badge_reservada y proyecta ubicacion=null cuando faltan coordenadas (RN-025, ADR-011)", () => {
    const wire = aPropiedadDetalleWire(
      ficha(propiedad({ estado: "reservada", latitud: null, longitud: null, barrio: null })),
    );

    expect(wire.estado).toBe("reservada");
    expect(wire.badge_reservada).toBe(true);
    expect(wire.ubicacion).toBeNull();
    // barrio nulo → cadena vacía (el contrato lo declara string).
    expect(wire.barrio).toBe("");
  });
});
