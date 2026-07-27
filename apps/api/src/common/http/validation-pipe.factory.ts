import { ValidationPipe, type ValidationError } from "@nestjs/common";
import { defaultMetadataStorage } from "class-transformer/cjs/storage";
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
            campo: resolverNombrePublicoDeCampo(error),
            mensaje,
          })),
        ),
      ),
  });
}

/**
 * Traduce el nombre interno de la propiedad del DTO (`error.property`, resuelto por
 * class-validator sobre la propiedad de la clase — típicamente camelCase) al nombre público del
 * query param / campo del body (snake_case, ADR-015) cuando el DTO declara un alias explícito
 * con `@Expose({ name })` (class-transformer) — ver `ListarUsuariosQueryDto.tamanoPagina`.
 *
 * Sin alias declarado, `error.property` YA es el nombre público: la convención mayoritaria de
 * los DTOs de este proyecto declara la propiedad directamente en snake_case (ver
 * `ListarPropiedadesQueryDto.tamano_pagina`, `BuscarCatalogoQueryDto.tamano_pagina`), así que se
 * usa tal cual. La resolución es general por diseño — cubre cualquier campo futuro que use
 * `@Expose({ name })`, no solo `tamano_pagina`.
 */
function resolverNombrePublicoDeCampo(error: ValidationError): string {
  const dtoClass = (error.target as { constructor?: Function } | undefined)?.constructor;
  if (!dtoClass || !error.property) {
    return error.property;
  }
  const alias = defaultMetadataStorage.findExposeMetadata(dtoClass, error.property)?.options?.name;
  return alias ?? error.property;
}
