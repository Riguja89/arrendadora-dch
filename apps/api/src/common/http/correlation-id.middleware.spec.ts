import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { CorrelationIdMiddleware, type RequestConCorrelationId } from "./correlation-id.middleware";

function buildResponse() {
  return { setHeader: vi.fn() } as unknown as Response & { setHeader: ReturnType<typeof vi.fn> };
}

describe("CorrelationIdMiddleware (DEI-003, ADR-015)", () => {
  const middleware = new CorrelationIdMiddleware();

  it("propaga el X-Correlation-ID entrante al request y a la respuesta", () => {
    const req = { headers: { "x-correlation-id": "corr-abc-123" } } as unknown as Request;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect((req as RequestConCorrelationId).correlationId).toBe("corr-abc-123");
    expect(res.setHeader).toHaveBeenCalledWith("X-Correlation-ID", "corr-abc-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("toma el primer valor cuando el header entrante es un array", () => {
    const req = { headers: { "x-correlation-id": ["corr-1", "corr-2"] } } as unknown as Request;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect((req as RequestConCorrelationId).correlationId).toBe("corr-1");
  });

  it("genera un correlation id nuevo (UUID) cuando el header está ausente", () => {
    const req = { headers: {} } as unknown as Request;
    const res = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    const generado = (req as RequestConCorrelationId).correlationId;
    expect(generado).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(res.setHeader).toHaveBeenCalledWith("X-Correlation-ID", generado);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
