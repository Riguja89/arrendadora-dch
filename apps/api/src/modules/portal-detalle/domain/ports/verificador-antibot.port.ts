export const VERIFICADOR_ANTIBOT = Symbol("VerificadorAntibotPort");

/**
 * Resultado de una verificación anti-bot (ADR-007). Distingue tres desenlaces para que la capa de
 * aplicación decida el status HTTP correcto (contrato DESIGN-029):
 *
 * - `disponible: false` → el servicio no respondió (red/config). No se puede validar → 503 (RN-003).
 * - `disponible: true, aprobado: false` → validado pero el score no superó el umbral → 403 (bot).
 * - `disponible: true, aprobado: true` → aprobado → se genera el deep link.
 *
 * `score` es informativo (traza/observabilidad); puede ser `null` cuando el servicio no lo provee.
 */
export interface ResultadoAntibot {
  disponible: boolean;
  aprobado: boolean;
  score: number | null;
}

/**
 * Puerto de dominio para la verificación anti-bot server-side del token de reCAPTCHA v3 (ADR-007).
 * Abstrae al proveedor (Google reCAPTCHA en producción, stub en dev/tests) para que el dominio y la
 * aplicación no dependan de credenciales ni de la API externa. La comparación contra el umbral de
 * score (configurable) es responsabilidad del adaptador — el puerto devuelve el veredicto ya
 * resuelto (`aprobado`).
 */
export interface VerificadorAntibotPort {
  verificar(token: string): Promise<ResultadoAntibot>;
}
