import type { ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest } from "@arrendadora/shared";
import { peticionApi, type RespuestaApi } from "./http-client";

/**
 * Cliente de los flujos de contraseña (contrato DESIGN-028, spec-auth-usuarios CU-002 + GAP-004):
 * `/auth/forgot-password` y `/auth/reset-password` son públicos (`security: []`); `/auth/change-password`
 * exige sesión activa. Envuelve `peticionApi()` — nunca lanza, siempre devuelve `RespuestaApi<T>`
 * (ADR-015). Mismo criterio que `usuarios-api.ts`.
 */

/** CU-002 pasos 1-4 — solicita el enlace de recuperación. RN-019: la API siempre responde 202 de forma neutra. */
export function solicitarRecuperacionPassword(payload: ForgotPasswordRequest): Promise<RespuestaApi<void>> {
  return peticionApi<void>("/auth/forgot-password", { method: "POST", body: payload });
}

/** CU-002 pasos 6-11 — restablece la contraseña con el token del enlace. 409 si el token venció o ya fue usado. */
export function restablecerPassword(payload: ResetPasswordRequest): Promise<RespuestaApi<void>> {
  return peticionApi<void>("/auth/reset-password", { method: "POST", body: payload });
}

/** GAP-004 — cambio de contraseña autenticado (voluntario o forzado tras alta con password temporal). */
export function cambiarPassword(payload: ChangePasswordRequest): Promise<RespuestaApi<void>> {
  return peticionApi<void>("/auth/change-password", { method: "POST", body: payload });
}
