import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter";
import { crearValidationPipe } from "../src/common/http/validation-pipe.factory";

/**
 * Prueba de integración del bootstrap real del `AppModule` bajo Express 5 / path-to-regexp v8
 * (hallazgo H-01 tras la migración a NestJS 11, ADR A-03).
 *
 * Blinda el fix crítico del comodín del middleware (`app.module.ts:40`,
 * `consumer.apply(CorrelationIdMiddleware).forRoutes("{*path}")`). Bajo Express 5 el wildcard sin
 * nombre `"*"` ya no es válido: si el comodín estuviera mal escrito, `app.init()` lanzaría al
 * registrar el middleware (path-to-regexp rechaza el patrón). Este test es el único que arranca el
 * `AppModule` COMPLETO — los 5 bounded contexts + configuración + PrismaModule + el middleware
 * global — vía supertest, cubriendo lo que hasta ahora solo validaban typecheck/build.
 *
 * `PrismaService` se sustituye por un stub (mismo patrón que `admin-propiedades-di.integration.spec.ts`)
 * para no requerir una base de datos real: es el único provider con `onModuleInit`/`$connect`, así
 * que con el stub `app.init()` no abre ninguna conexión externa.
 */
describe("Bootstrap de AppModule bajo Express 5 (H-01)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    // Fidelidad con `main.ts`: mismo filtro global, mismo pipe y mismo prefijo versionado.
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    // Si el comodín `"{*path}"` del CorrelationIdMiddleware fuera inválido bajo Express 5,
    // este `init()` lanzaría — de ahí que arrancar sin error ya es la primera aserción de H-01.
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("arranca sin error y expone GET /health con status 200", async () => {
    const respuesta = await request(app.getHttpServer()).get("/health");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ status: "ok" });
  });

  it("aplica el CorrelationIdMiddleware vía el comodín `{*path}` (header X-Correlation-ID presente)", async () => {
    const respuesta = await request(app.getHttpServer()).get("/health");

    // Evidencia de que el middleware global corrió antes del controller: el header se setea en
    // la respuesta incluso en `/health`, que está fuera del prefijo `v1` pero sí cubierto por
    // el comodín `forRoutes("{*path}")`.
    expect(respuesta.headers["x-correlation-id"]).toBeDefined();
  });

  it("propaga el X-Correlation-ID entrante en la respuesta (reuso, no regeneración)", async () => {
    const entrante = "corr-h01-fixed-id";
    const respuesta = await request(app.getHttpServer())
      .get("/health")
      .set("X-Correlation-ID", entrante);

    expect(respuesta.headers["x-correlation-id"]).toBe(entrante);
  });
});
