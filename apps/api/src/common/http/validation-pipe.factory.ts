import { ValidationPipe, type ValidationError } from "@nestjs/common";
import { ValidationHttpException } from "../errors/validation-http.exception";

/**
 * Construye el `ValidationPipe` global de la API. Extraído de `main.ts` para que las pruebas
 * de integración ejerciten EXACTAMENTE la misma configuración (whitelist estricta + transform)
 * sin riesgo de drift entre el bootstrap real y el harness de test.
 *
 * El contrato OpenAPI (DESIGN-028) declara 422 con `detalles[]` para los fallos de validación
 * de request body/query — no el 400 genérico de Nest (ADR-015). Por eso el `exceptionFactory`
 * traduce los errores de class-validator a `ValidationHttpException`.
 */
export function crearValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new ValidationHttpException(
        errors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map((mensaje) => ({
            campo: error.property,
            mensaje,
          })),
        ),
      ),
  });
}
