import type { AccionEstadoUsuario, EstadoUsuario, RolUsuario } from "@arrendadora/shared";

/**
 * Etiquetas y máquina de acciones del estado de usuario — spec-005 CU-004/HU-004, ADR-014,
 * `cambiar-estado-usuario.use-case.ts` (backend, fuente de verdad de las transiciones válidas).
 *
 * Lógica pura — la autoridad real vive en el backend; esto solo controla qué acción ofrece la UI
 * para no mostrar botones que el servidor rechazaría con 409 (`AccionEstadoInvalidaError`).
 */

export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  administrador: "Administrador",
  agente: "Agente",
  editor: "Editor",
};

export const ETIQUETAS_ESTADO_USUARIO: Record<EstadoUsuario, string> = {
  activo: "Activo",
  desactivado: "Desactivado",
  bloqueado: "Bloqueado",
};

export const ETIQUETAS_ACCION_ESTADO: Record<AccionEstadoUsuario, string> = {
  activar: "Activar",
  desactivar: "Desactivar",
  desbloquear: "Desbloquear",
};

/**
 * Acción disponible para el estado actual (`activo → desactivar`, `desactivado → activar`,
 * `bloqueado → desbloquear`) — cada estado admite exactamente una transición hacia adelante.
 */
export function accionDisponible(estado: EstadoUsuario): AccionEstadoUsuario | null {
  switch (estado) {
    case "activo":
      return "desactivar";
    case "desactivado":
      return "activar";
    case "bloqueado":
      return "desbloquear";
    default:
      return null;
  }
}

/** Mensaje de confirmación (`window.confirm`) antes de aplicar la acción — texto de spec-005 CU-004/HU-004. */
export function mensajeConfirmacionAccion(accion: AccionEstadoUsuario, nombreUsuario: string): string {
  switch (accion) {
    case "desactivar":
      return `¿Desactivar a "${nombreUsuario}"? No podrá iniciar sesión; sus propiedades asignadas permanecen en el sistema (RN-037).`;
    case "activar":
      return `¿Activar a "${nombreUsuario}"? Podrá volver a iniciar sesión con sus credenciales.`;
    case "desbloquear":
      return `¿Desbloquear a "${nombreUsuario}"? Se reinicia su contador de intentos fallidos.`;
    default:
      return "¿Confirmás esta acción?";
  }
}
