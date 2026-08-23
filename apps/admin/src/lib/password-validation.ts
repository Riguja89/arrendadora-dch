import type { ChangePasswordRequest, DetalleErrorCampo, ForgotPasswordRequest, ResetPasswordRequest } from "@arrendadora/shared";

/**
 * Validación cliente de los flujos de contraseña (spec-auth-usuarios CU-002 + GAP-004 cambio
 * autenticado). Espejo *no autoritativo* de los DTOs/VOs del backend
 * (`forgot-password.dto.ts`, `reset-password.dto.ts`, `change-password.dto.ts`,
 * `password.vo.ts`) — el servidor sigue siendo la fuente de verdad (422 `ErrorValidacion`, 409
 * token inválido). Mismo criterio que `usuarios-validation.ts`.
 */

/** RN-019 — mensaje neutro exacto (CU-002 paso 4): nunca revela si el email existe. */
export const MENSAJE_FORGOT_PASSWORD_NEUTRO =
  "Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña.";

/** RN-019 — flujo de excepción 7a: enlace vencido, ya usado o inexistente. */
export const MENSAJE_ENLACE_INVALIDO = "Este enlace ya no es válido. Solicitá uno nuevo.";

/** RN-034 — mensaje exacto que usa el backend (`password.vo.ts` / `PasswordInvalidaError`). */
export const MENSAJE_PASSWORD_INVALIDA =
  "La contraseña debe tener mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.";

/** CU-002 9a — las contraseñas ingresadas no coinciden. */
export const MENSAJE_PASSWORDS_NO_COINCIDEN = "Las contraseñas no coinciden.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RN-034 — espejo de `cumplePoliticaPassword()` en `apps/api/.../domain/value-objects/password.vo.ts`. */
function cumplePoliticaPassword(valor: string): boolean {
  return valor.length >= 8 && /[A-Z]/.test(valor) && /[a-z]/.test(valor) && /[0-9]/.test(valor);
}

export interface ResultadoValidacionCampo {
  valido: boolean;
  errores: Record<string, string>;
}

/** CU-002 paso 3 — valida el email del formulario "Olvidé mi contraseña". */
export function validarEmailRecuperacion(email: string): ResultadoValidacionCampo {
  const errores: Record<string, string> = {};

  if (email.trim().length === 0) {
    errores.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errores.email = "Ingresá un correo electrónico válido.";
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Arma el payload `ForgotPasswordRequest` — POST /auth/forgot-password. */
export function construirPayloadForgotPassword(email: string): ForgotPasswordRequest {
  return { email: email.trim() };
}

export interface ValoresNuevaPassword {
  passwordNueva: string;
  confirmacion: string;
}

/**
 * RN-034 + confirmación de coincidencia — reutilizado por el reset con token (CU-002) y por el
 * cambio autenticado (GAP-004). El error de campo siempre se reporta bajo la clave wire
 * `password_nueva` para poder fundirse con `detalles[]` del 422 del backend
 * (`mapearErroresValidacionPassword`).
 */
export function validarNuevaPassword(valores: ValoresNuevaPassword): ResultadoValidacionCampo {
  const errores: Record<string, string> = {};

  if (valores.passwordNueva.length === 0) {
    errores.password_nueva = "La nueva contraseña es obligatoria.";
  } else if (!cumplePoliticaPassword(valores.passwordNueva)) {
    errores.password_nueva = MENSAJE_PASSWORD_INVALIDA;
  }

  // Solo se evalúa la coincidencia si la nueva contraseña ya es válida — evitar un segundo error
  // ruidoso sobre un valor que de todas formas va a ser rechazado.
  if (errores.password_nueva === undefined && valores.passwordNueva !== valores.confirmacion) {
    errores.confirmacion = MENSAJE_PASSWORDS_NO_COINCIDEN;
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Arma el payload `ResetPasswordRequest` — POST /auth/reset-password (CU-002 paso 9-10). */
export function construirPayloadResetPassword(token: string, passwordNueva: string): ResetPasswordRequest {
  return { token, password_nueva: passwordNueva };
}

export interface ValoresCambioPassword extends ValoresNuevaPassword {
  passwordActual: string;
}

/** POST /auth/change-password — exige `password_actual` además de la nueva contraseña + confirmación (GAP-004). */
export function validarCambioPassword(valores: ValoresCambioPassword): ResultadoValidacionCampo {
  const errores: Record<string, string> = {};

  if (valores.passwordActual.length === 0) {
    errores.password_actual = "La contraseña actual es obligatoria.";
  }

  const { errores: erroresNueva } = validarNuevaPassword(valores);
  Object.assign(errores, erroresNueva);

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Arma el payload `ChangePasswordRequest` — POST /auth/change-password. */
export function construirPayloadCambioPassword(valores: ValoresCambioPassword): ChangePasswordRequest {
  return { password_actual: valores.passwordActual, password_nueva: valores.passwordNueva };
}

/** Mapea `ErrorValidacion.detalles[]` (422, campos snake_case del wire) a errores por campo del form. */
export function mapearErroresValidacionPassword(detalles: DetalleErrorCampo[] | undefined): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const detalle of detalles ?? []) {
    errores[detalle.campo] = detalle.mensaje;
  }
  return errores;
}
