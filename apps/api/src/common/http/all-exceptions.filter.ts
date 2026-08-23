import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import type { CodigoError, RespuestaError } from "@arrendadora/shared";
import { DominioError } from "../errors/dominio-error.base";
import { ValidationHttpException } from "../errors/validation-http.exception";
import type { RequestConCorrelationId } from "./correlation-id.middleware";

const HTTP_STATUS_A_CODIGO: Record<number, CodigoError> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  503: "SERVICE_UNAVAILABLE",
  500: "INTERNAL_ERROR",
};

/**
 * Filtro global de excepciones — única puerta de salida de errores de la API (ADR-015,
 * regla DEI-003). Traduce tres familias de excepción al mismo envelope:
 *
 * 1. `DominioError` (y subclases) — errores de negocio de cualquier bounded context, ya
 *    conocen su `httpStatus`/`codigo`/`detalles`.
 * 2. `ValidationHttpException` — fallos de `class-validator` del `ValidationPipe` global.
 * 3. Cualquier otra `HttpException` de Nest o error no controlado — se degrada a 500 con
 *    mensaje genérico (nunca se filtra el stack trace ni detalles internos al cliente).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestConCorrelationId>();
    const correlationId = request.correlationId ?? randomUUID();

    const { status, body } = this.resolver(exception, correlationId);
    response.status(status).json(body);
  }

  private resolver(
    exception: unknown,
    correlationId: string,
  ): { status: number; body: RespuestaError } {
    if (exception instanceof DominioError) {
      return {
        status: exception.httpStatus,
        body: {
          error: exception.codigo,
          message: exception.message,
          correlation_id: correlationId,
          ...(exception.detalles ? { detalles: exception.detalles } : {}),
        },
      };
    }

    if (exception instanceof ValidationHttpException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          error: "UNPROCESSABLE_ENTITY",
          message: exception.message,
          correlation_id: correlationId,
          detalles: exception.detalles,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const respuesta = exception.getResponse();
      const message =
        typeof respuesta === "string"
          ? respuesta
          : ((respuesta as { message?: string }).message ?? exception.message);
      return {
        status,
        body: {
          error: HTTP_STATUS_A_CODIGO[status] ?? "VALIDATION_ERROR",
          message: Array.isArray(message) ? message.join(" ") : message,
          correlation_id: correlationId,
        },
      };
    }

    // eslint-disable-next-line no-console
    console.error(`[correlation_id=${correlationId}] error no controlado:`, exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado. Intentá nuevamente más tarde.",
        correlation_id: correlationId,
      },
    };
  }
}
