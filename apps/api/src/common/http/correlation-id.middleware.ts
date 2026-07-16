import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

/** Request con `correlationId` ya resuelto — ver `CorrelationIdMiddleware`. */
export interface RequestConCorrelationId extends Request {
  correlationId: string;
}

const HEADER = "x-correlation-id";

/**
 * Propaga `X-Correlation-ID` (DEI-003, ADR-015): reusa el header entrante si el cliente lo
 * envía, o genera uno nuevo en el boundary de entrada. Se agrega también a la respuesta para
 * que el consumidor pueda correlacionar sin depender del body en respuestas 204/202.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const entrante = req.headers[HEADER];
    const correlationId = (Array.isArray(entrante) ? entrante[0] : entrante) || randomUUID();
    (req as RequestConCorrelationId).correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    next();
  }
}
