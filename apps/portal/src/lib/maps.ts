import type { UbicacionAproximada } from "@arrendadora/shared";

/**
 * Utilidades puras para el mapa aproximado de la ficha de detalle (ADR-011): la propiedad nunca
 * expone la dirección exacta en el portal, solo la zona/barrio — el mapa muestra un marcador
 * sobre las coordenadas aproximadas que fija el agente, nunca en el punto exacto de la puerta.
 *
 * Degradación (spec-002 CU-001, flujo de excepción 2b / HU-001 escenario 4): si no hay clave de
 * Google Maps configurada, o la propiedad no tiene ubicación, no se intenta cargar el mapa — el
 * componente que consume `construirUrlEmbedMapa` cae a un bloque de texto con ciudad/barrio.
 */

/** Modo `place` de Google Maps Embed API: renderiza un marcador sobre la ubicación (aproximada). */
const GOOGLE_MAPS_EMBED_BASE_URL = "https://www.google.com/maps/embed/v1/place";

/** Nivel de zoom fijo para la vista aproximada — suficiente para ubicar el sector, no la puerta. */
const ZOOM_APROXIMADO = 15;

/** `true` si hay una API key de Google Maps configurada (env `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). */
export function estaMapaConfigurado(apiKey: string | undefined): boolean {
  return Boolean(apiKey && apiKey.trim().length > 0);
}

/**
 * Construye la URL del iframe de Google Maps Embed API (modo `place`, con marcador) ubicado en
 * el punto aproximado de la propiedad. `null` si falta la API key o la propiedad no tiene
 * coordenadas — el llamador debe degradar a texto en ambos casos. El marcador cae sobre la
 * ubicación aproximada (zona/barrio, ADR-011), nunca sobre la dirección exacta.
 */
export function construirUrlEmbedMapa(
  ubicacion: UbicacionAproximada | null,
  apiKey: string | undefined,
): string | null {
  if (!ubicacion || !estaMapaConfigurado(apiKey)) return null;

  const params = new URLSearchParams({
    key: apiKey as string,
    q: `${ubicacion.latitud},${ubicacion.longitud}`,
    zoom: String(ZOOM_APROXIMADO),
  });
  return `${GOOGLE_MAPS_EMBED_BASE_URL}?${params.toString()}`;
}
