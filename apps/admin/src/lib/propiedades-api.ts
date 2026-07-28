import type { RolUsuario, Usuario } from "@arrendadora/shared";
import { peticionApi, type RespuestaApi } from "./http-client";
import type {
  Amenidad,
  CambiarEstadoPropiedadRequest,
  CatalogoCrear,
  FiltrosPropiedades,
  HistorialEstado,
  Propiedad,
  PropiedadCrear,
  PropiedadEditar,
  PropiedadesPaginadas,
  TipoPropiedadCatalogo,
  UbicacionActualizar,
  UbicacionRespuesta,
} from "./propiedades-types";

/**
 * Cliente de la superficie `/admin/propiedades*` y catálogos relacionados (contrato DESIGN-028).
 * Envuelve `peticionApi()` — nunca lanza, siempre devuelve `RespuestaApi<T>` (ADR-015).
 */

/** Arma el query string de `GET /admin/propiedades` a partir de los filtros activos — lógica pura y testeable. */
export function construirQueryPropiedades(filtros: FiltrosPropiedades): string {
  const params = new URLSearchParams();

  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.tipo_operacion) params.set("tipo_operacion", filtros.tipo_operacion);
  if (filtros.tipo_propiedad_id) params.set("tipo_propiedad_id", filtros.tipo_propiedad_id);
  if (filtros.agente) params.set("agente", filtros.agente);
  if (filtros.archivada !== undefined) params.set("archivada", String(filtros.archivada));
  if (filtros.q && filtros.q.trim().length > 0) params.set("q", filtros.q.trim());
  if (filtros.pagina !== undefined) params.set("pagina", String(filtros.pagina));
  if (filtros.tamano_pagina !== undefined) params.set("tamano_pagina", String(filtros.tamano_pagina));

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function listarPropiedades(filtros: FiltrosPropiedades = {}, signal?: AbortSignal): Promise<RespuestaApi<PropiedadesPaginadas>> {
  return peticionApi<PropiedadesPaginadas>(`/admin/propiedades${construirQueryPropiedades(filtros)}`, { signal });
}

export function obtenerPropiedad(id: string, signal?: AbortSignal): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>(`/admin/propiedades/${id}`, { signal });
}

export function crearPropiedad(payload: PropiedadCrear): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>("/admin/propiedades", { method: "POST", body: payload });
}

export function editarPropiedad(id: string, payload: PropiedadEditar): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>(`/admin/propiedades/${id}`, { method: "PUT", body: payload });
}

export function archivarPropiedad(id: string): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>(`/admin/propiedades/${id}/archivar`, { method: "POST" });
}

export function restaurarPropiedad(id: string): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>(`/admin/propiedades/${id}/restaurar`, { method: "POST" });
}

export function cambiarEstadoPropiedad(id: string, payload: CambiarEstadoPropiedadRequest): Promise<RespuestaApi<Propiedad>> {
  return peticionApi<Propiedad>(`/admin/propiedades/${id}/estado`, { method: "PATCH", body: payload });
}

export function obtenerHistorialEstado(id: string, signal?: AbortSignal): Promise<RespuestaApi<HistorialEstado[]>> {
  return peticionApi<HistorialEstado[]>(`/admin/propiedades/${id}/historial`, { signal });
}

export function establecerUbicacion(id: string, payload: UbicacionActualizar): Promise<RespuestaApi<UbicacionRespuesta>> {
  return peticionApi<UbicacionRespuesta>(`/admin/propiedades/${id}/ubicacion`, { method: "PUT", body: payload });
}

// ---- Catálogos (ADR-005) ----

export function listarTiposPropiedad(signal?: AbortSignal): Promise<RespuestaApi<TipoPropiedadCatalogo[]>> {
  return peticionApi<TipoPropiedadCatalogo[]>("/admin/tipos-propiedad", { signal });
}

export function crearTipoPropiedad(payload: CatalogoCrear): Promise<RespuestaApi<TipoPropiedadCatalogo>> {
  return peticionApi<TipoPropiedadCatalogo>("/admin/tipos-propiedad", { method: "POST", body: payload });
}

export function listarAmenidades(signal?: AbortSignal): Promise<RespuestaApi<Amenidad[]>> {
  return peticionApi<Amenidad[]>("/admin/amenidades", { signal });
}

// ---- Agentes (solo lectura, para el selector "Agente responsable" — RN-016, HU-004) ----

/**
 * Lista usuarios con rol `agente` activos, para el selector "Agente responsable" del formulario
 * (RN-016) y el filtro por agente del listado (HU-004 DoD, solo Administrador). `GET
 * /admin/usuarios` exige rol Administrador (DESIGN-028) — este helper solo debe invocarse con
 * esa sesión; no implementa la gestión de usuarios (fuera de alcance de este incremento).
 */
export async function listarAgentesActivos(signal?: AbortSignal): Promise<RespuestaApi<Usuario[]>> {
  const respuesta = await peticionApi<{ data: Usuario[] }>(
    `/admin/usuarios?rol=${"agente" satisfies RolUsuario}&estado=activo&tamano_pagina=100`,
    { signal },
  );
  if (!respuesta.ok) return respuesta;
  return { ok: true, data: respuesta.data.data };
}
