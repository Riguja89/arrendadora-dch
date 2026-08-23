import { describe, expect, it } from "vitest";
import { Propiedad, type CrearPropiedadInput } from "./propiedad.entity";
import { Coordenadas } from "../value-objects/coordenadas.vo";
import {
  PrecioInvalidoError,
  ReaperturaSoloAdministradorError,
  TransicionEstadoInvalidaError,
} from "../errors/dominio-propiedades.errors";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const DESPUES = new Date("2026-07-02T12:00:00.000Z");

function baseInput(over: Partial<CrearPropiedadInput> = {}): CrearPropiedadInput {
  return {
    id: "prop-1",
    codigo: "AP-001",
    titulo: "Apartamento en Chapinero",
    descripcion: "Amplio y luminoso",
    tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    direccion: "Calle 63 #10-20",
    precio: 1_500_000,
    area: 85,
    habitaciones: 3,
    banos: 2,
    estrato: 4,
    parqueaderos: 1,
    destacada: true,
    agenteId: "agente-1",
    amenidades: [{ amenidadId: "am-1", cantidad: 1 }],
    ahora: AHORA,
    ...over,
  };
}

describe("Propiedad (aggregate)", () => {
  describe("crear (CU-001, HU-001)", () => {
    it("arranca en estado disponible, no archivada y visible en el portal", () => {
      const p = Propiedad.crear(baseInput()).toProps();
      expect(p.estado).toBe("disponible");
      expect(p.archivada).toBe(false);
      expect(p.publicadaEn).toEqual(AHORA);
      expect(p.slug).toBe("apartamento-en-chapinero-ap-001");
      expect(p.createdAt).toEqual(AHORA);
      expect(p.updatedAt).toEqual(AHORA);
    });

    it("propaga el error de precio inválido desde el VO (RN-017)", () => {
      expect(() => Propiedad.crear(baseInput({ precio: 0 }))).toThrow(PrecioInvalidoError);
    });

    it("copia el arreglo de amenidades (no comparte referencia con el input)", () => {
      const amenidades = [{ amenidadId: "am-1", cantidad: 2 }];
      const p = Propiedad.crear(baseInput({ amenidades }));
      amenidades.push({ amenidadId: "am-2", cantidad: 1 });
      expect(p.toProps().amenidades).toHaveLength(1);
    });
  });

  describe("editarDatos (CU-002)", () => {
    it("actualiza los campos y toca updatedAt, sin cambiar estado ni slug (RN-007)", () => {
      const p = Propiedad.crear(baseInput());
      p.editarDatos(
        {
          titulo: "Nuevo título",
          descripcion: "Nueva descripción",
          tipoOperacion: "venta",
          tipoPropiedadId: "tipo-2",
          ciudad: "Medellín",
          barrio: "El Poblado",
          direccion: null,
          precio: 2_000_000,
          area: 100,
          habitaciones: 4,
          banos: 3,
          estrato: 6,
          parqueaderos: 2,
          destacada: false,
          amenidades: [],
        },
        DESPUES,
      );
      const props = p.toProps();
      expect(props.titulo).toBe("Nuevo título");
      expect(props.precio).toBe(2_000_000);
      expect(props.slug).toBe("apartamento-en-chapinero-ap-001");
      expect(props.estado).toBe("disponible");
      expect(props.updatedAt).toEqual(DESPUES);
    });

    it("no toca el agente cuando agenteId es undefined (RN-016 — no lo reasigna)", () => {
      const p = Propiedad.crear(baseInput({ agenteId: "agente-1" }));
      p.editarDatos(
        {
          titulo: "t",
          descripcion: "d",
          tipoOperacion: "arriendo",
          tipoPropiedadId: "tipo-1",
          ciudad: "Bogotá",
          barrio: "b",
          direccion: null,
          precio: 1_000_000,
          area: 50,
          habitaciones: 1,
          banos: 1,
          estrato: null,
          parqueaderos: null,
          destacada: false,
          amenidades: [],
        },
        DESPUES,
      );
      expect(p.agenteId).toBe("agente-1");
    });

    it("reasigna el agente cuando agenteId se provee explícitamente", () => {
      const p = Propiedad.crear(baseInput({ agenteId: "agente-1" }));
      p.editarDatos(
        {
          titulo: "t",
          descripcion: "d",
          tipoOperacion: "arriendo",
          tipoPropiedadId: "tipo-1",
          ciudad: "Bogotá",
          barrio: "b",
          direccion: null,
          precio: 1_000_000,
          area: 50,
          habitaciones: 1,
          banos: 1,
          estrato: null,
          parqueaderos: null,
          destacada: false,
          agenteId: "agente-2",
          amenidades: [],
        },
        DESPUES,
      );
      expect(p.agenteId).toBe("agente-2");
    });
  });

  describe("cambiarEstado (CU-003, HU-002, RN-012)", () => {
    it("aplica una transición válida y devuelve el estado anterior", () => {
      const p = Propiedad.crear(baseInput());
      const anterior = p.cambiarEstado("reservada", "agente", DESPUES);
      expect(anterior).toBe("disponible");
      expect(p.estado).toBe("reservada");
      expect(p.toProps().updatedAt).toEqual(DESPUES);
    });

    it("rechaza una transición inválida (arrendada_vendida → reservada)", () => {
      const p = Propiedad.crear(baseInput());
      p.cambiarEstado("arrendada_vendida", "agente", DESPUES);
      expect(() => p.cambiarEstado("reservada", "agente", DESPUES)).toThrow(
        TransicionEstadoInvalidaError,
      );
    });

    it("un Agente no puede reabrir arrendada_vendida → disponible (RN-012)", () => {
      const p = Propiedad.crear(baseInput());
      p.cambiarEstado("arrendada_vendida", "agente", DESPUES);
      expect(() => p.cambiarEstado("disponible", "agente", DESPUES)).toThrow(
        ReaperturaSoloAdministradorError,
      );
    });

    it("el Administrador sí reabre arrendada_vendida → disponible", () => {
      const p = Propiedad.crear(baseInput());
      p.cambiarEstado("arrendada_vendida", "administrador", DESPUES);
      const anterior = p.cambiarEstado("disponible", "administrador", DESPUES);
      expect(anterior).toBe("arrendada_vendida");
      expect(p.estado).toBe("disponible");
    });
  });

  describe("archivar / restaurar (RN-027)", () => {
    it("archivar marca archivada = true", () => {
      const p = Propiedad.crear(baseInput());
      p.archivar(DESPUES);
      expect(p.archivada).toBe(true);
      expect(p.toProps().updatedAt).toEqual(DESPUES);
    });

    it("restaurar vuelve a archivada = false", () => {
      const p = Propiedad.crear(baseInput());
      p.archivar(DESPUES);
      p.restaurar(DESPUES);
      expect(p.archivada).toBe(false);
    });
  });

  describe("establecerUbicacion (RN-033)", () => {
    it("arranca sin coordenadas (null, null)", () => {
      const p = Propiedad.crear(baseInput());
      expect(p.latitud).toBeNull();
      expect(p.longitud).toBeNull();
    });

    it("fija latitud/longitud y toca updatedAt", () => {
      const p = Propiedad.crear(baseInput());
      p.establecerUbicacion(Coordenadas.crear(4.710989, -74.072092), DESPUES);
      expect(p.latitud).toBe(4.710989);
      expect(p.longitud).toBe(-74.072092);
      expect(p.toProps().updatedAt).toEqual(DESPUES);
    });

    it("expone la direccion vía getter (usada por el caso de uso para geocodificar)", () => {
      const p = Propiedad.crear(baseInput({ direccion: "Calle 63 #10-20" }));
      expect(p.direccion).toBe("Calle 63 #10-20");
    });
  });

  describe("duplicar (HU-003, RN-026)", () => {
    it("copia datos con nuevo código/slug, estado disponible y sin destacada", () => {
      const original = Propiedad.crear(baseInput({ destacada: true }));
      original.cambiarEstado("reservada", "agente", DESPUES);

      const copia = original.duplicar({
        nuevoId: "prop-2",
        nuevoCodigo: "AP-002",
        agenteId: "agente-9",
        ahora: DESPUES,
      }).toProps();

      expect(copia.id).toBe("prop-2");
      expect(copia.codigo).toBe("AP-002");
      expect(copia.estado).toBe("disponible");
      expect(copia.destacada).toBe(false);
      expect(copia.agenteId).toBe("agente-9");
      expect(copia.titulo).toBe(original.titulo);
      expect(copia.slug).toBe("apartamento-en-chapinero-ap-002");
      expect(copia.amenidades).toEqual([{ amenidadId: "am-1", cantidad: 1 }]);
    });
  });
});
