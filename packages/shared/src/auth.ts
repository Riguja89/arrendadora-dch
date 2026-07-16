/**
 * Tipos públicos de Autenticación y Usuarios (ANALYZE-005) — subconjunto del contrato OpenAPI
 * admin (`docs/architecture/contracts/2026-07-03-001-DESIGN-028-openapi-admin-api.yaml`,
 * paths `/auth/*` y `/admin/usuarios*`, schemas `Usuario` / `UsuarioCrear` / `UsuarioEditar` /
 * `SesionUsuario`).
 *
 * Nota de nomenclatura: estos tipos describen el **shape exacto del JSON sobre el wire**
 * (snake_case), tal como lo define el contrato OpenAPI (ADR-015). Difieren en convención de
 * `pagination.ts`/`error.ts` (camelCase) — ver `apps/api/src/modules/auth-usuarios/CLAUDE.md`
 * para la nota de esta inconsistencia pre-existente entre el scaffolding y el contrato.
 */

export type RolUsuario = "administrador" | "agente" | "editor";

export type EstadoUsuario = "activo" | "desactivado" | "bloqueado";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  whatsapp: string | null;
  requiere_cambio_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface SesionUsuario {
  usuario: Usuario;
  requiere_cambio_password: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password_nueva: string;
}

export interface ChangePasswordRequest {
  password_actual: string;
  password_nueva: string;
}

export interface UsuarioCrear {
  nombre: string;
  email: string;
  rol: RolUsuario;
  whatsapp?: string | null;
}

export interface UsuarioEditar {
  nombre?: string;
  rol?: RolUsuario;
  whatsapp?: string | null;
}

export type AccionEstadoUsuario = "activar" | "desactivar" | "desbloquear";

export interface CambiarEstadoUsuarioRequest {
  accion: AccionEstadoUsuario;
}
