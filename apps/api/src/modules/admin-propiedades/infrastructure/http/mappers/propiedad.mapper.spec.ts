import { describe, expect, it } from "vitest";
import { aPropiedadFotoWire, aPropiedadWire, aUbicacionWire } from "./propiedad.mapper";
import { Propiedad } from "../../../domain/entities/propiedad.entity";
import { Coordenadas } from "../../../domain/value-objects/coordenadas.vo";
import type { FotoPublica } from "../../../../admin-multimedia/domain/ports/multimedia-query.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedad(): Propiedad {
  return Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId: "agente-1", amenidades: [], ahora: AHORA,
  });
}

function foto(orden: number, esPortada: boolean): FotoPublica {
  return {
    id: `foto-${orden}`, orden, esPortada, formatoOriginal: "webp",
    urlOptimizada: `https://cdn/${orden}/o.webp`, urlCard: `https://cdn/${orden}/c.webp`,
    urlThumbnail: `https://cdn/${orden}/t.webp`, createdAt: AHORA,
  };
}

describe("aPropiedadFotoWire", () => {
  it("mapea FotoPublica (camelCase) al item snake_case del contrato, inyectando propiedad_id", () => {
    const wire = aPropiedadFotoWire(foto(1, true), "prop-1");
    expect(wire).toEqual({
      id: "foto-1",
      propiedad_id: "prop-1",
      orden: 1,
      es_portada: true,
      formato_original: "webp",
      url_optimizada: "https://cdn/1/o.webp",
      url_card: "https://cdn/1/c.webp",
      url_thumbnail: "https://cdn/1/t.webp",
      created_at: "2026-07-01T10:00:00.000Z",
    });
  });
});

describe("aPropiedadWire — fotos[]", () => {
  it("omite `fotos` cuando el llamador no las resuelve (listado / crear / editar)", () => {
    const wire = aPropiedadWire(propiedad());
    expect(wire).not.toHaveProperty("fotos");
  });

  it("puebla `fotos` conservando el orden recibido (portada primero, RN-014) con el shape wire", () => {
    const fotos = [foto(1, true), foto(2, false), foto(3, false)];
    const wire = aPropiedadWire(propiedad(), fotos);
    expect(wire.fotos).toHaveLength(3);
    expect(wire.fotos?.map((f) => f.id)).toEqual(["foto-1", "foto-2", "foto-3"]);
    expect(wire.fotos?.[0]).toMatchObject({ propiedad_id: "prop-1", es_portada: true, orden: 1 });
    expect(wire.fotos?.[1]).toMatchObject({ es_portada: false, orden: 2 });
  });

  it("emite `fotos: []` cuando la ficha resuelve y la propiedad no tiene fotos", () => {
    const wire = aPropiedadWire(propiedad(), []);
    expect(wire.fotos).toEqual([]);
  });
});

describe("aUbicacionWire (RN-033)", () => {
  it("mapea latitud/longitud null cuando la propiedad no tiene ubicación fijada", () => {
    expect(aUbicacionWire(propiedad())).toEqual({ latitud: null, longitud: null });
  });

  it("mapea latitud/longitud una vez fijada la ubicación", () => {
    const p = propiedad();
    p.establecerUbicacion(Coordenadas.crear(4.710989, -74.072092), AHORA);
    expect(aUbicacionWire(p)).toEqual({ latitud: 4.710989, longitud: -74.072092 });
  });
});
