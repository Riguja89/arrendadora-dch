import type { DetalleErrorCampo } from "@arrendadora/shared";
import type { Amenidad, Propiedad, PropiedadAmenidad, PropiedadAmenidadCrear, PropiedadCrear, TipoOperacion } from "./propiedades-types";

/**
 * Validación cliente del formulario de propiedad (spec-003 RN-017, RN-018; contrato
 * `PropiedadCrear`/`PropiedadEditar`, DESIGN-028). Espejo *no autoritativo* de las validaciones
 * del backend — el servidor sigue siendo la fuente de verdad (422 `ErrorValidacion`); esto solo
 * evita viajes de red innecesarios y guía al usuario (HU-001 escenario 2/3).
 */

/** Valores crudos del formulario — todos como string porque vienen de inputs controlados. */
export interface PropiedadFormValues {
  titulo: string;
  descripcion: string;
  tipo_operacion: TipoOperacion | "";
  tipo_propiedad_id: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  precio: string;
  area: string;
  habitaciones: string;
  banos: string;
  estrato: string;
  parqueaderos: string;
  destacada: boolean;
  agente_id: string;
  amenidades: Array<{ amenidad_id: string; nombre: string; seleccionada: boolean; cantidad: string }>;
}

export interface ResultadoValidacionPropiedad {
  valido: boolean;
  errores: Record<string, string>;
}

/**
 * Interpreta un precio ingresado en COP (RN-017): acepta dígitos con separadores de miles
 * `.`/`,` (HU-001 escenario 3, ej. "1.500.000") y los descarta antes de parsear. `null` si el
 * resultado no es un entero positivo válido.
 */
export function parsearPrecioCOP(valor: string): number | null {
  const limpio = valor.trim().replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(limpio)) return null;
  const numero = Number(limpio);
  return Number.isSafeInteger(numero) && numero >= 1 ? numero : null;
}

/** Entero positivo simple (área, habitaciones, baños) — sin separadores de miles (RN-018). */
function parsearEnteroPositivo(valor: string, minimo = 0): number | null {
  const limpio = valor.trim();
  if (!/^\d+$/.test(limpio)) return null;
  const numero = Number(limpio);
  return Number.isSafeInteger(numero) && numero >= minimo ? numero : null;
}

function parsearEnteroOpcional(valor: string, min: number, max?: number): number | null | undefined {
  if (valor.trim() === "") return null;
  const numero = parsearEnteroPositivo(valor, min);
  if (numero === null) return undefined; // marca de "inválido" — se distingue de null (vacío) por el llamador
  if (max !== undefined && numero > max) return undefined;
  return numero;
}

/** Valida los campos obligatorios del contrato `PropiedadCrear` (RN-017, RN-018). */
export function validarFormularioPropiedad(valores: PropiedadFormValues): ResultadoValidacionPropiedad {
  const errores: Record<string, string> = {};

  if (valores.titulo.trim().length === 0) errores.titulo = "El título es obligatorio.";
  if (valores.descripcion.trim().length === 0) errores.descripcion = "La descripción es obligatoria.";
  if (valores.tipo_operacion === "") errores.tipo_operacion = "Seleccioná el tipo de operación.";
  if (valores.tipo_propiedad_id.trim().length === 0) errores.tipo_propiedad_id = "Seleccioná el tipo de propiedad.";
  if (valores.ciudad.trim().length === 0) errores.ciudad = "La ciudad es obligatoria.";
  if (valores.barrio.trim().length === 0) errores.barrio = "El barrio/sector es obligatorio.";

  if (valores.precio.trim().length === 0) {
    errores.precio = "El precio es obligatorio.";
  } else if (parsearPrecioCOP(valores.precio) === null) {
    errores.precio = "Ingresá un precio válido en pesos colombianos (COP), sin decimales ni negativos.";
  }

  if (valores.area.trim().length === 0) {
    errores.area = "El área es obligatoria.";
  } else if (parsearEnteroPositivo(valores.area, 1) === null) {
    errores.area = "El área debe ser un número entero positivo, en m².";
  }

  if (valores.habitaciones.trim().length === 0) {
    errores.habitaciones = "El número de habitaciones es obligatorio.";
  } else if (parsearEnteroPositivo(valores.habitaciones, 0) === null) {
    errores.habitaciones = "Ingresá un número entero válido de habitaciones.";
  }

  if (valores.banos.trim().length === 0) {
    errores.banos = "El número de baños es obligatorio.";
  } else if (parsearEnteroPositivo(valores.banos, 0) === null) {
    errores.banos = "Ingresá un número entero válido de baños.";
  }

  if (valores.estrato.trim() !== "" && parsearEnteroOpcional(valores.estrato, 1, 6) === undefined) {
    errores.estrato = "El estrato debe ser un número entero entre 1 y 6.";
  }

  if (valores.parqueaderos.trim() !== "" && parsearEnteroOpcional(valores.parqueaderos, 0) === undefined) {
    errores.parqueaderos = "El número de parqueaderos debe ser un entero positivo.";
  }

  for (const amenidad of valores.amenidades) {
    if (!amenidad.seleccionada) continue;
    const cantidad = parsearEnteroPositivo(amenidad.cantidad, 1);
    if (cantidad === null) {
      errores[`amenidad_${amenidad.amenidad_id}`] = `Ingresá una cantidad válida para "${amenidad.nombre}".`;
    }
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Arma el payload `PropiedadCrear`/`PropiedadEditar` a partir de valores ya validados. */
export function construirPayloadPropiedad(valores: PropiedadFormValues): PropiedadCrear {
  const amenidades: PropiedadAmenidadCrear[] = valores.amenidades
    .filter((a) => a.seleccionada)
    .map((a) => ({ amenidad_id: a.amenidad_id, cantidad: parsearEnteroPositivo(a.cantidad, 1) ?? 1 }));

  return {
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim(),
    tipo_operacion: valores.tipo_operacion as TipoOperacion,
    tipo_propiedad_id: valores.tipo_propiedad_id,
    ciudad: valores.ciudad.trim(),
    barrio: valores.barrio.trim(),
    direccion: valores.direccion.trim() === "" ? null : valores.direccion.trim(),
    precio: parsearPrecioCOP(valores.precio) ?? 0,
    area: parsearEnteroPositivo(valores.area, 1) ?? 0,
    habitaciones: parsearEnteroPositivo(valores.habitaciones, 0) ?? 0,
    banos: parsearEnteroPositivo(valores.banos, 0) ?? 0,
    estrato: valores.estrato.trim() === "" ? null : (parsearEnteroOpcional(valores.estrato, 1, 6) ?? null),
    parqueaderos: valores.parqueaderos.trim() === "" ? null : (parsearEnteroOpcional(valores.parqueaderos, 0) ?? null),
    destacada: valores.destacada,
    agente_id: valores.agente_id.trim() === "" ? null : valores.agente_id,
    amenidades,
  };
}

/** Valores iniciales del formulario (sin `amenidades`, que depende del catálogo) — vacíos para crear, prellenados para editar. */
export function valoresInicialesPropiedad(propiedad?: Propiedad): Omit<PropiedadFormValues, "amenidades"> {
  if (!propiedad) {
    return {
      titulo: "",
      descripcion: "",
      tipo_operacion: "",
      tipo_propiedad_id: "",
      ciudad: "",
      barrio: "",
      direccion: "",
      precio: "",
      area: "",
      habitaciones: "",
      banos: "",
      estrato: "",
      parqueaderos: "",
      destacada: false,
      agente_id: "",
    };
  }

  return {
    titulo: propiedad.titulo,
    descripcion: propiedad.descripcion,
    tipo_operacion: propiedad.tipo_operacion,
    tipo_propiedad_id: propiedad.tipo_propiedad_id,
    ciudad: propiedad.ciudad,
    barrio: propiedad.barrio,
    direccion: propiedad.direccion ?? "",
    precio: String(propiedad.precio),
    area: String(propiedad.area),
    habitaciones: String(propiedad.habitaciones),
    banos: String(propiedad.banos),
    estrato: propiedad.estrato !== null ? String(propiedad.estrato) : "",
    parqueaderos: propiedad.parqueaderos !== null ? String(propiedad.parqueaderos) : "",
    destacada: propiedad.destacada,
    agente_id: propiedad.agente_id ?? "",
  };
}

/** Combina el catálogo de amenidades activas con las ya asignadas a la propiedad (edición) — checkbox + cantidad (GAP-003). */
export function construirAmenidadesFormulario(
  catalogo: Amenidad[],
  actuales: PropiedadAmenidad[] = [],
): PropiedadFormValues["amenidades"] {
  const actualesPorId = new Map(actuales.map((a) => [a.amenidad_id, a]));
  return catalogo
    .filter((a) => a.activo)
    .map((a) => {
      const actual = actualesPorId.get(a.id);
      return {
        amenidad_id: a.id,
        nombre: a.nombre,
        seleccionada: actual !== undefined,
        cantidad: actual !== undefined ? String(actual.cantidad) : "1",
      };
    });
}

/** Mapea `ErrorValidacion.detalles[]` (422, campos snake_case del wire) a errores por campo del form. */
export function mapearErroresValidacion(detalles: DetalleErrorCampo[] | undefined): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const detalle of detalles ?? []) {
    errores[detalle.campo] = detalle.mensaje;
  }
  return errores;
}
