import type { RolUsuario } from "@arrendadora/shared";

/**
 * Helpers RBAC de navegación del panel — matriz de permisos ADR-014
 * (`docs/architecture/decisions/2026-07-03-001-DESIGN-031-adr-014-rbac-modelo-permisos.md`).
 *
 * La **autoridad** de RBAC vive siempre en la capa de aplicación del backend (ADR-014): estos
 * helpers solo controlan qué ve/oculta la UI (nav, rutas) — nunca sustituyen el enforcement del
 * servidor.
 */

/** Gestión de usuarios (`/admin/usuarios*`) — exclusivo del Administrador (matriz ADR-014). */
export const ROLES_GESTION_USUARIOS: readonly RolUsuario[] = ["administrador"];

/** Configuración del sistema (`/admin/configuracion`) — exclusivo del Administrador (matriz ADR-014). */
export const ROLES_GESTION_CONFIGURACION: readonly RolUsuario[] = ["administrador"];

export function tieneRolPermitido(rol: RolUsuario | null, rolesPermitidos: readonly RolUsuario[]): boolean {
  return rol !== null && rolesPermitidos.includes(rol);
}

export function puedeGestionarUsuarios(rol: RolUsuario | null): boolean {
  return tieneRolPermitido(rol, ROLES_GESTION_USUARIOS);
}

export function puedeGestionarConfiguracion(rol: RolUsuario | null): boolean {
  return tieneRolPermitido(rol, ROLES_GESTION_CONFIGURACION);
}
