import type { FormatoImagen } from "../value-objects/formato-imagen.vo";

/**
 * Constantes de negocio de la galería de fotos (spec-004, ADR-008 / gaps-multimedia).
 * Centralizadas para que las reglas y los casos de uso no las hardcodeen.
 */

/** GAP-001 — máximo de fotos por propiedad; se rechaza la que exceda este tope. */
export const MAX_FOTOS_POR_PROPIEDAD = 10;

/** GAP-001 / gaps-propiedades GAP-004 — mínimo de fotos para una propiedad visible en el portal. */
export const MIN_FOTOS_PROPIEDAD_VISIBLE = 1;

/** RN-030 — peso máximo por imagen antes de optimizar (10 MB). */
export const TAMANO_MAX_BYTES = 10 * 1024 * 1024;

/** RN-029 — formatos de imagen permitidos. Cualquier otro (GIF, BMP, TIFF, SVG…) se rechaza. */
export const FORMATOS_PERMITIDOS: readonly FormatoImagen[] = ["jpg", "png", "webp"];

/**
 * Mapa MIME → formato canónico (RN-029). Se aceptan los MIME estándar de cada formato; `jpeg`
 * y `jpg` colapsan a `jpg`.
 */
export const MIME_A_FORMATO: Readonly<Record<string, FormatoImagen>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Variantes que el pipeline de optimización genera por foto (ADR-008, RN-006): la optimizada de
 * máxima resolución, la de tarjeta de listado y el thumbnail del panel. El orden es el de subida.
 */
export const VARIANTES_IMAGEN = ["original", "card", "thumbnail"] as const;
export type VarianteImagen = (typeof VARIANTES_IMAGEN)[number];
