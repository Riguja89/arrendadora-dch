export const GEOCODING = Symbol("GeocodingPort");

export interface GeocodingResultado {
  /** `false` si el proveedor no pudo resolver la dirección (RN-033, excepción — ver panel). */
  encontrado: boolean;
  latitud: number | null;
  longitud: number | null;
}

/**
 * Puerto de geocodificación (ADR-011) — traduce una dirección de texto a coordenadas
 * (latitud/longitud). Detrás de Google Geocoding API en producción
 * (`GoogleGeocodingAdapter`); en dev/tests un adaptador stub determinístico evita depender de
 * credenciales reales de Google Maps (`StubGeocodingAdapter`). El caso de uso NUNCA llama a un
 * proveedor concreto directamente — solo a este puerto.
 */
export interface GeocodingPort {
  geocodificar(direccion: string): Promise<GeocodingResultado>;
}
