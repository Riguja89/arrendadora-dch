import { peticionApi, type RespuestaApi } from "./http-client";
import { construirFormDataFotos } from "./fotos-validation";
import type { CargarFotosRespuesta, Foto } from "./propiedades-types";

/**
 * Cliente de la superficie `/admin/propiedades/{id}/fotos*` (spec-004, contrato DESIGN-028,
 * sección Multimedia). Envuelve `peticionApi()` — nunca lanza, siempre devuelve
 * `RespuestaApi<T>` (ADR-015).
 */

/** CU-001 (RN-028/RN-029/RN-030) — carga múltiple, multipart. Respuesta 207: detalle por archivo. */
export function cargarFotos(propiedadId: string, archivos: File[]): Promise<RespuestaApi<CargarFotosRespuesta>> {
  return peticionApi<CargarFotosRespuesta>(`/admin/propiedades/${propiedadId}/fotos`, {
    method: "POST",
    body: construirFormDataFotos(archivos),
  });
}

/** CU-002 (RN-031) — nuevo orden de visualización, como lista completa de IDs de foto. */
export function reordenarFotos(propiedadId: string, orden: string[]): Promise<RespuestaApi<Foto[]>> {
  return peticionApi<Foto[]>(`/admin/propiedades/${propiedadId}/fotos/orden`, { method: "PATCH", body: { orden } });
}

/** CU-002 (RN-014) — marca `fotoId` como portada única de la propiedad. */
export function marcarFotoPortada(propiedadId: string, fotoId: string): Promise<RespuestaApi<Foto[]>> {
  return peticionApi<Foto[]>(`/admin/propiedades/${propiedadId}/fotos/${fotoId}/portada`, { method: "PATCH" });
}

/** RN-032 — elimina una foto; si era la portada, el backend reasigna la siguiente en orden. */
export function eliminarFoto(propiedadId: string, fotoId: string): Promise<RespuestaApi<undefined>> {
  return peticionApi<undefined>(`/admin/propiedades/${propiedadId}/fotos/${fotoId}`, { method: "DELETE" });
}
