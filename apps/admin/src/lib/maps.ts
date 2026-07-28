/**
 * Utilidades puras del bloque de ubicación del formulario de propiedad (ADR-011): el panel fija
 * coordenadas por geocodificación de la dirección (delegada al backend, `PUT
 * .../ubicacion { geocodificar_direccion: true }`) o por edición manual de latitud/longitud. La
 * vista previa de mapa (iframe embed, solo lectura) es un plus visual — nunca bloquea el guardado.
 *
 * Degradación (mismo criterio que `apps/portal/src/lib/maps.ts`): sin
 * `VITE_GOOGLE_MAPS_API_KEY` configurada, o sin coordenadas aún, no se intenta cargar el iframe —
 * el componente que consume `construirUrlEmbedMapaAdmin` cae a un mensaje de texto.
 */

const GOOGLE_MAPS_EMBED_BASE_URL = "https://www.google.com/maps/embed/v1/view";

/** Zoom más cercano que el del portal — en el panel sí interesa precisión de pin, no solo zona. */
const ZOOM_PRECISO = 17;

/** `true` si hay una API key de Google Maps configurada (env `VITE_GOOGLE_MAPS_API_KEY`). */
export function estaMapaConfigurado(apiKey: string | undefined): boolean {
  return Boolean(apiKey && apiKey.trim().length > 0);
}

export interface CoordenadasPropiedad {
  latitud: number;
  longitud: number;
}

/**
 * Construye la URL del iframe de Google Maps Embed API centrada en las coordenadas actuales del
 * formulario. `null` si falta la API key o todavía no hay coordenadas — el llamador degrada a
 * texto en ambos casos.
 */
export function construirUrlEmbedMapaAdmin(
  coordenadas: CoordenadasPropiedad | null,
  apiKey: string | undefined,
): string | null {
  if (!coordenadas || !estaMapaConfigurado(apiKey)) return null;

  const params = new URLSearchParams({
    key: apiKey as string,
    center: `${coordenadas.latitud},${coordenadas.longitud}`,
    zoom: String(ZOOM_PRECISO),
  });
  return `${GOOGLE_MAPS_EMBED_BASE_URL}?${params.toString()}`;
}

/** Valida un string de latitud/longitud ingresado a mano — `null` si no es un número en rango válido. */
export function parsearCoordenada(valor: string, min: number, max: number): number | null {
  const limpio = valor.trim();
  if (limpio === "") return null;
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero < min || numero > max) return null;
  return numero;
}

export function parsearLatitud(valor: string): number | null {
  return parsearCoordenada(valor, -90, 90);
}

export function parsearLongitud(valor: string): number | null {
  return parsearCoordenada(valor, -180, 180);
}
