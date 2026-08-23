/**
 * Envelope de error API-wide (ADR-015, regla DEI-003).
 *
 * `error` es un código técnico estable en SCREAMING_SNAKE_CASE (inglés).
 * `message` es el texto legible en español para el usuario/operador.
 * `correlation_id` (snake_case sobre el wire) se propaga desde `X-Correlation-ID` o se genera en el boundary de entrada.
 */

export type CodigoError =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STATE_TRANSITION_INVALID"
  | "UNPROCESSABLE_ENTITY"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface DetalleErrorCampo {
  campo: string;
  mensaje: string;
}

export interface RespuestaError {
  error: CodigoError;
  message: string;
  correlation_id: string;
  detalles?: DetalleErrorCampo[];
}

/** Mapa HTTP → código de error (ADR-015). */
export const HTTP_A_CODIGO_ERROR: Record<number, CodigoError> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  503: "SERVICE_UNAVAILABLE",
  500: "INTERNAL_ERROR",
};
