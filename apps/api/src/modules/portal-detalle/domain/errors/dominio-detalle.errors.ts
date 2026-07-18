import { DominioError } from "../../../../common/errors/dominio-error.base";

/**
 * Errores de negocio del bounded context `portal-detalle` (ANALYZE-002). Cada uno conoce su
 * `httpStatus`/`codigo` (ADR-015) — el `AllExceptionsFilter` global los traduce al envelope de
 * error API-wide con `correlation_id` (DEI-003). Los mensajes visibles van en español (voseo).
 */

/**
 * RN-025 — la propiedad no existe, está `arrendada_vendida` o archivada: no es visible en el portal.
 * Mapea a 404 `NOT_FOUND` (contrato DESIGN-029, respuesta `NoEncontrado`). No se revela si el slug
 * nunca existió o dejó de ser público — misma respuesta para ambos.
 */
export class PropiedadNoEncontradaError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor() {
    super("La propiedad solicitada no está disponible.");
  }
}

/**
 * ADR-007 — el anti-bot (reCAPTCHA v3) rechazó la solicitud de contacto por comportamiento
 * sospechoso (score por debajo del umbral). Mapea a 403 `FORBIDDEN` (contrato DESIGN-029). El
 * visitante puede reintentar (spec-002 CU-002 flujo de excepción 3a).
 */
export class ContactoRechazadoError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("No pudimos validar tu solicitud. Por favor intentá de nuevo.");
  }
}

/**
 * RN-003 / ADR-007 — el servicio anti-bot no está disponible (error de red o de configuración): el
 * portal NO debe exponer el enlace sin validación. Mapea a 503 `SERVICE_UNAVAILABLE` (contrato
 * DESIGN-029). Es un fallo de infraestructura, no un rechazo del visitante.
 */
export class ServicioAntibotNoDisponibleError extends DominioError {
  readonly httpStatus = 503;
  readonly codigo = "SERVICE_UNAVAILABLE" as const;
  constructor() {
    super("En este momento no podemos validar tu solicitud. Intentá de nuevo en unos minutos.");
  }
}
