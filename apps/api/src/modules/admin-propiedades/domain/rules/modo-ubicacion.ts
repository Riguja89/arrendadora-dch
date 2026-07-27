import { UbicacionModoInvalidoError } from "../errors/dominio-propiedades.errors";

export type ModoUbicacion = "manual" | "geocodificar";

export interface UbicacionInput {
  latitud?: number | null;
  longitud?: number | null;
  geocodificarDireccion?: boolean;
}

/**
 * RN-033 — la ubicación de una propiedad se fija mediante EXACTAMENTE uno de dos modos:
 * (a) coordenadas manuales completas (`latitud` + `longitud`), o (b) geocodificación de la
 * dirección (`geocodificarDireccion: true`). Nunca ambos a la vez (ambigüedad sobre qué
 * coordenada prevalece) ni ninguno (el request no tiene ninguna acción que ejecutar). Un
 * `latitud`/`longitud` parcial (solo uno de los dos) tampoco es un modo válido.
 *
 * Regla pura de dominio — sin I/O. La resolución del modo "geocodificar" (llamar al
 * `GeocodingPort`) la orquesta el caso de uso; esta función solo decide QUÉ modo aplica.
 */
export function resolverModoUbicacion(input: UbicacionInput): ModoUbicacion {
  const tieneLatitud = input.latitud !== undefined && input.latitud !== null;
  const tieneLongitud = input.longitud !== undefined && input.longitud !== null;
  const tieneManualCompleto = tieneLatitud && tieneLongitud;
  const tieneManualParcial = tieneLatitud !== tieneLongitud;
  const tieneGeocodificar = input.geocodificarDireccion === true;

  if (tieneManualParcial) {
    throw new UbicacionModoInvalidoError();
  }
  if (tieneManualCompleto && tieneGeocodificar) {
    throw new UbicacionModoInvalidoError();
  }
  if (!tieneManualCompleto && !tieneGeocodificar) {
    throw new UbicacionModoInvalidoError();
  }
  return tieneManualCompleto ? "manual" : "geocodificar";
}
