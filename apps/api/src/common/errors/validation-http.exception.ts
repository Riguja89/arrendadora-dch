import { HttpException, HttpStatus } from "@nestjs/common";
import type { DetalleErrorCampo } from "@arrendadora/shared";

/**
 * Excepción emitida por el `exceptionFactory` del `ValidationPipe` global (main.ts) cuando
 * `class-validator` rechaza un DTO de entrada. El contrato OpenAPI (DESIGN-028) documenta
 * `422 UNPROCESSABLE_ENTITY` con `detalles[]` para estos casos en prácticamente todos los
 * endpoints de auth-usuarios — no el `400` genérico de Nest.
 */
export class ValidationHttpException extends HttpException {
  readonly detalles: DetalleErrorCampo[];

  constructor(detalles: DetalleErrorCampo[]) {
    super("Error de validación de los datos enviados.", HttpStatus.UNPROCESSABLE_ENTITY);
    this.detalles = detalles;
  }
}
