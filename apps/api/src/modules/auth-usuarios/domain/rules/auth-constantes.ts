/**
 * Constantes de negocio de autenticación — valores resueltos por gaps-auth-usuarios y
 * documentados en ADR-004. No son configuración de despliegue: son reglas de negocio.
 */

/** GAP-005 — TTL de sesión deslizante (30 min de inactividad, se renueva con actividad). */
export const SESION_TTL_MINUTOS = 30;

/** GAP-006 — a los 5 intentos fallidos consecutivos, bloqueo permanente (RN, ADR-004). */
export const MAX_INTENTOS_FALLIDOS = 5;

/** RN-019 — el enlace de recuperación de contraseña vale máximo 60 minutos, un solo uso. */
export const RESET_TOKEN_TTL_MINUTOS = 60;

/** Longitud de la contraseña temporal generada al crear un usuario (GAP-004 opción A). */
export const PASSWORD_TEMPORAL_LONGITUD = 12;
