import type { AccionEstadoUsuario, EstadoUsuario, RolUsuario, Usuario, UsuarioCrear, UsuarioEditar } from "@arrendadora/shared";
import { peticionApi, type RespuestaApi } from "./http-client";

/**
 * Cliente de la superficie `/admin/usuarios*` (contrato DESIGN-028, spec-005 CU-003/CU-004).
 * Envuelve `peticionApi()` — nunca lanza, siempre devuelve `RespuestaApi<T>` (ADR-015). Mismo
 * criterio que `propiedades-api.ts`.
 */

export interface FiltrosUsuarios {
  estado?: EstadoUsuario;
  rol?: RolUsuario;
  pagina?: number;
  tamano_pagina?: number;
}

/**
 * Shape real de `GET /admin/usuarios` — bloque `meta` **anidado**
 * (`usuarios.controller.ts` → `{ data, meta: aPaginacionWire(...) }`), no el `allOf` plano que
 * describe DESIGN-028 (copiado por error del endpoint de propiedades). El backend en este punto
 * sigue el patrón general de paginación de ADR-015 (`RespuestaPaginada<T>`,
 * `packages/shared/src/pagination.ts`: "toda respuesta paginada expone el bloque `meta` junto al
 * array `data`"), con las claves del bloque en snake_case para el wire. Mismo tipo de corrección
 * ya documentada para `DELETE .../fotos/{fotoId}` — ver CLAUDE.md de este paquete.
 */
export interface UsuariosPaginados {
  data: Usuario[];
  meta: {
    pagina: number;
    tamano_pagina: number;
    total: number;
    total_paginas: number;
  };
}

/**
 * Respuesta de `POST /admin/usuarios` — campo aditivo `password_temporal` no documentado en el
 * schema `Usuario` del OpenAPI (GAP-004 opción A): el backend genera una contraseña temporal y
 * la devuelve una única vez para que el Administrador la comparta con el nuevo usuario.
 */
export interface UsuarioCreado extends Usuario {
  password_temporal: string;
}

/** Arma el query string de `GET /admin/usuarios` a partir de los filtros activos — lógica pura y testeable. */
export function construirQueryUsuarios(filtros: FiltrosUsuarios): string {
  const params = new URLSearchParams();

  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.rol) params.set("rol", filtros.rol);
  if (filtros.pagina !== undefined) params.set("pagina", String(filtros.pagina));
  if (filtros.tamano_pagina !== undefined) params.set("tamano_pagina", String(filtros.tamano_pagina));

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function listarUsuarios(filtros: FiltrosUsuarios = {}, signal?: AbortSignal): Promise<RespuestaApi<UsuariosPaginados>> {
  return peticionApi<UsuariosPaginados>(`/admin/usuarios${construirQueryUsuarios(filtros)}`, { signal });
}

export function obtenerUsuario(id: string, signal?: AbortSignal): Promise<RespuestaApi<Usuario>> {
  return peticionApi<Usuario>(`/admin/usuarios/${id}`, { signal });
}

/** CU-003 — crea un usuario interno; queda activo (RN-035) con `requiere_cambio_password = true` (GAP-004). */
export function crearUsuario(payload: UsuarioCrear): Promise<RespuestaApi<UsuarioCreado>> {
  return peticionApi<UsuarioCreado>("/admin/usuarios", { method: "POST", body: payload });
}

/** CU-004 — edita nombre/rol/whatsapp. El email no es editable (ANALYZE-005, no forma parte de `UsuarioEditar`). */
export function editarUsuario(id: string, payload: UsuarioEditar): Promise<RespuestaApi<Usuario>> {
  return peticionApi<Usuario>(`/admin/usuarios/${id}`, { method: "PUT", body: payload });
}

/** HU-004 — activa, desactiva o desbloquea (`cambiar-estado-usuario.use-case.ts`). */
export function cambiarEstadoUsuario(id: string, accion: AccionEstadoUsuario): Promise<RespuestaApi<Usuario>> {
  return peticionApi<Usuario>(`/admin/usuarios/${id}/estado`, { method: "PATCH", body: { accion } });
}
