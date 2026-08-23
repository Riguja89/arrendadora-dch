/** Formato de imagen permitido (RN-029). El sistema solo acepta estos tres. */
export type FormatoImagen = "jpg" | "png" | "webp";

/** `content-type` con el que se sirve cada formato desde el almacenamiento/CDN. */
export const CONTENT_TYPE_POR_FORMATO: Readonly<Record<FormatoImagen, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
