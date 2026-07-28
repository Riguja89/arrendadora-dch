import { describe, expect, it } from "vitest";
import {
  construirAmenidadesFormulario,
  construirPayloadPropiedad,
  mapearErroresValidacion,
  parsearPrecioCOP,
  valoresInicialesPropiedad,
  validarFormularioPropiedad,
  type PropiedadFormValues,
} from "./propiedad-form-validation";
import type { Amenidad, Propiedad } from "./propiedades-types";

function valoresValidos(overrides: Partial<PropiedadFormValues> = {}): PropiedadFormValues {
  return {
    titulo: "Apartamento en Chapinero",
    descripcion: "Amplio, luminoso, cerca al parque.",
    tipo_operacion: "arriendo",
    tipo_propiedad_id: "tipo-1",
    ciudad: "Yopal",
    barrio: "Centro",
    direccion: "",
    precio: "1500000",
    area: "80",
    habitaciones: "3",
    banos: "2",
    estrato: "",
    parqueaderos: "",
    destacada: false,
    agente_id: "",
    amenidades: [],
    ...overrides,
  };
}

describe("parsearPrecioCOP (RN-017)", () => {
  it("acepta un entero simple", () => {
    expect(parsearPrecioCOP("1500000")).toBe(1500000);
  });

  it("acepta separadores de miles con puntos (HU-001 escenario 3)", () => {
    expect(parsearPrecioCOP("1.500.000")).toBe(1500000);
  });

  it("acepta separadores de miles con comas", () => {
    expect(parsearPrecioCOP("1,500,000")).toBe(1500000);
  });

  it("rechaza negativos", () => {
    expect(parsearPrecioCOP("-100")).toBeNull();
  });

  it("rechaza letras", () => {
    expect(parsearPrecioCOP("abc")).toBeNull();
  });

  it("rechaza cero (mínimo 1, RN-017)", () => {
    expect(parsearPrecioCOP("0")).toBeNull();
  });
});

describe("validarFormularioPropiedad", () => {
  it("es válido con todos los campos obligatorios completos", () => {
    const resultado = validarFormularioPropiedad(valoresValidos());
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it("marca el campo precio faltante con mensaje descriptivo (HU-001 escenario 2)", () => {
    const resultado = validarFormularioPropiedad(valoresValidos({ precio: "" }));
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.precio).toMatch(/obligatorio/i);
  });

  it("marca precio con formato inválido", () => {
    const resultado = validarFormularioPropiedad(valoresValidos({ precio: "no es un número" }));
    expect(resultado.errores.precio).toBeDefined();
  });

  it("marca área inválida (RN-018 — entero positivo)", () => {
    expect(validarFormularioPropiedad(valoresValidos({ area: "-5" })).errores.area).toBeDefined();
    expect(validarFormularioPropiedad(valoresValidos({ area: "10.5" })).errores.area).toBeDefined();
  });

  it("exige tipo de operación y tipo de propiedad", () => {
    const resultado = validarFormularioPropiedad(valoresValidos({ tipo_operacion: "", tipo_propiedad_id: "" }));
    expect(resultado.errores.tipo_operacion).toBeDefined();
    expect(resultado.errores.tipo_propiedad_id).toBeDefined();
  });

  it("estrato opcional fuera de rango (1-6) es inválido", () => {
    expect(validarFormularioPropiedad(valoresValidos({ estrato: "7" })).errores.estrato).toBeDefined();
    expect(validarFormularioPropiedad(valoresValidos({ estrato: "0" })).errores.estrato).toBeDefined();
  });

  it("estrato vacío es válido (opcional)", () => {
    expect(validarFormularioPropiedad(valoresValidos({ estrato: "" })).errores.estrato).toBeUndefined();
  });

  it("amenidad seleccionada sin cantidad válida produce error específico", () => {
    const resultado = validarFormularioPropiedad(
      valoresValidos({
        amenidades: [{ amenidad_id: "am-1", nombre: "Piscina", seleccionada: true, cantidad: "" }],
      }),
    );
    expect(resultado.errores["amenidad_am-1"]).toMatch(/Piscina/);
  });

  it("amenidad no seleccionada no se valida aunque tenga cantidad vacía", () => {
    const resultado = validarFormularioPropiedad(
      valoresValidos({
        amenidades: [{ amenidad_id: "am-1", nombre: "Piscina", seleccionada: false, cantidad: "" }],
      }),
    );
    expect(resultado.valido).toBe(true);
  });
});

describe("construirPayloadPropiedad", () => {
  it("arma el payload con precio/área parseados y campos opcionales normalizados a null", () => {
    const payload = construirPayloadPropiedad(valoresValidos({ precio: "1.200.000" }));
    expect(payload.precio).toBe(1200000);
    expect(payload.area).toBe(80);
    expect(payload.estrato).toBeNull();
    expect(payload.parqueaderos).toBeNull();
    expect(payload.direccion).toBeNull();
    expect(payload.agente_id).toBeNull();
  });

  it("incluye solo las amenidades seleccionadas con su cantidad", () => {
    const payload = construirPayloadPropiedad(
      valoresValidos({
        amenidades: [
          { amenidad_id: "am-1", nombre: "Piscina", seleccionada: true, cantidad: "1" },
          { amenidad_id: "am-2", nombre: "BBQ", seleccionada: false, cantidad: "" },
        ],
      }),
    );
    expect(payload.amenidades).toEqual([{ amenidad_id: "am-1", cantidad: 1 }]);
  });
});

describe("valoresInicialesPropiedad", () => {
  it("retorna valores vacíos sin propiedad (modo crear)", () => {
    const valores = valoresInicialesPropiedad();
    expect(valores.titulo).toBe("");
    expect(valores.tipo_operacion).toBe("");
    expect(valores.destacada).toBe(false);
  });

  it("prellena desde una propiedad existente (modo editar), normalizando null a string vacío", () => {
    const propiedad: Propiedad = {
      id: "p-1",
      codigo: "AP-001",
      titulo: "Casa campestre",
      slug: "casa-campestre",
      descripcion: "Descripción",
      tipo_operacion: "venta",
      tipo_propiedad_id: "tipo-1",
      ciudad: "Aguazul",
      barrio: "La Esperanza",
      direccion: null,
      precio: 250000000,
      area: 200,
      habitaciones: 4,
      banos: 3,
      estrato: null,
      parqueaderos: null,
      estado: "disponible",
      destacada: true,
      archivada: false,
      agente_id: null,
      latitud: null,
      longitud: null,
      amenidades: [],
      fotos: [],
      publicada_en: null,
      created_at: "2026-07-01T00:00:00Z",
      updated_at: "2026-07-01T00:00:00Z",
    };

    const valores = valoresInicialesPropiedad(propiedad);
    expect(valores.titulo).toBe("Casa campestre");
    expect(valores.precio).toBe("250000000");
    expect(valores.direccion).toBe("");
    expect(valores.estrato).toBe("");
    expect(valores.destacada).toBe(true);
  });
});

describe("construirAmenidadesFormulario", () => {
  const catalogo: Amenidad[] = [
    { id: "am-1", nombre: "Piscina", activo: true, orden: 1 },
    { id: "am-2", nombre: "BBQ", activo: true, orden: 2 },
    { id: "am-3", nombre: "Descontinuada", activo: false, orden: 3 },
  ];

  it("excluye amenidades inactivas del catálogo", () => {
    const resultado = construirAmenidadesFormulario(catalogo, []);
    expect(resultado.map((a) => a.amenidad_id)).toEqual(["am-1", "am-2"]);
  });

  it("marca seleccionada=true y usa la cantidad actual para las amenidades ya asignadas", () => {
    const resultado = construirAmenidadesFormulario(catalogo, [{ amenidad_id: "am-1", nombre: "Piscina", cantidad: 2 }]);
    const piscina = resultado.find((a) => a.amenidad_id === "am-1");
    expect(piscina).toEqual({ amenidad_id: "am-1", nombre: "Piscina", seleccionada: true, cantidad: "2" });
  });

  it("amenidades no asignadas quedan sin seleccionar, con cantidad por defecto '1'", () => {
    const resultado = construirAmenidadesFormulario(catalogo, []);
    const bbq = resultado.find((a) => a.amenidad_id === "am-2");
    expect(bbq).toEqual({ amenidad_id: "am-2", nombre: "BBQ", seleccionada: false, cantidad: "1" });
  });
});

describe("mapearErroresValidacion", () => {
  it("mapea detalles[] del 422 a un diccionario por campo (snake_case)", () => {
    const errores = mapearErroresValidacion([
      { campo: "precio", mensaje: "El precio debe ser mayor a cero." },
      { campo: "tipo_propiedad_id", mensaje: "Seleccioná un tipo de propiedad válido." },
    ]);
    expect(errores).toEqual({
      precio: "El precio debe ser mayor a cero.",
      tipo_propiedad_id: "Seleccioná un tipo de propiedad válido.",
    });
  });

  it("retorna objeto vacío si no hay detalles", () => {
    expect(mapearErroresValidacion(undefined)).toEqual({});
  });
});
