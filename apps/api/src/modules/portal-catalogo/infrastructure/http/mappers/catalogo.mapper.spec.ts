import { describe, expect, it } from "vitest";
import {
  aBusquedaCatalogoWire,
  aPropiedadResumenWire,
} from "./catalogo.mapper";
import type { TarjetaCatalogo } from "../../../application/use-cases/buscar-catalogo.use-case";
import type { PropiedadCatalogo } from "../../../domain/read-models/propiedad-catalogo.read-model";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function tarjeta(overrides: Partial<PropiedadCatalogo> = {}, portadaUrl = "https://cdn/p.jpg"): TarjetaCatalogo {
  return {
    propiedad: {
      id: "prop-1",
      codigo: "AP-001",
      titulo: "Apartamento con vista",
      slug: "apartamento-chapinero-ap-001",
      tipoOperacion: "arriendo",
      tipoPropiedadNombre: "Apartamento",
      ciudad: "Bogotá",
      barrio: "Chapinero",
      precio: 2_500_000,
      area: 72,
      habitaciones: 3,
      banos: 2,
      estado: "disponible",
      destacada: false,
      publicadaEn: AHORA,
      createdAt: AHORA,
      ...overrides,
    },
    portadaUrl,
  };
}

describe("catalogo.mapper", () => {
  it("mapea al shape snake_case del contrato sin exponer datos internos (ADR-011, privacidad)", () => {
    const wire = aPropiedadResumenWire(tarjeta());

    expect(wire).toEqual({
      codigo: "AP-001",
      titulo: "Apartamento con vista",
      slug: "apartamento-chapinero-ap-001",
      tipo_operacion: "arriendo",
      tipo_propiedad: "Apartamento",
      ciudad: "Bogotá",
      barrio: "Chapinero",
      precio: 2_500_000,
      area: 72,
      habitaciones: 3,
      banos: 2,
      estado: "disponible",
      badge_reservada: false,
      portada_url: "https://cdn/p.jpg",
    });
    // La tarjeta pública NO incluye dirección, agente, coordenadas ni historial.
    expect(wire).not.toHaveProperty("direccion");
    expect(wire).not.toHaveProperty("agente_id");
    expect(wire).not.toHaveProperty("latitud");
  });

  it("marca badge_reservada cuando el estado es reservada (RN-013)", () => {
    const wire = aPropiedadResumenWire(tarjeta({ estado: "reservada" }));
    expect(wire.estado).toBe("reservada");
    expect(wire.badge_reservada).toBe(true);
  });

  it("proyecta barrio nulo como cadena vacía para respetar el contrato", () => {
    const wire = aPropiedadResumenWire(tarjeta({ barrio: null }));
    expect(wire.barrio).toBe("");
  });

  it("ensambla la respuesta paginada con el bloque plano del contrato (ADR-015)", () => {
    const wire = aBusquedaCatalogoWire([tarjeta(), tarjeta()], 30, 2, 12);
    expect(wire.pagina).toBe(2);
    expect(wire.tamano_pagina).toBe(12);
    expect(wire.total).toBe(30);
    expect(wire.total_paginas).toBe(3);
    expect(wire.data).toHaveLength(2);
    // Shape plano — sin envelope anidado `meta` (a diferencia del admin).
    expect(wire).not.toHaveProperty("meta");
  });
});
