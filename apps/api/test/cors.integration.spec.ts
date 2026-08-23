import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import helmet from "helmet";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter";
import { crearValidationPipe } from "../src/common/http/validation-pipe.factory";
import { SanitizePipe } from "../src/common/http/sanitize.pipe";
import { crearCorsOptions } from "../src/common/http/cors.factory";

/**
 * Regresión del gap "el API nunca habilita CORS" (run 2026-07-03-001, fase Construir): sin esto,
 * el panel admin (`http://localhost:5173`) y el portal (`http://localhost:5174`) no pueden
 * consumir la API desde el navegador — el preflight `OPTIONS` respondía 404 y las respuestas
 * reales no traían ningún header `Access-Control-*` (evidencia previa al fix).
 *
 * Arranca el `AppModule` COMPLETO (mismo patrón que `app-bootstrap.integration.spec.ts`, H-01) y
 * aplica `crearCorsOptions()` — la MISMA factory que corre en `main.ts` — para que el test valide
 * exactamente la config que corre en producción, no una reconstrucción manual que pueda divergir.
 * `PrismaService` se sustituye por un stub — ningún caso de estos ejercita persistencia real.
 */
describe("CORS — panel/portal cross-origin con credenciales (A-08 follow-up)", () => {
  let app: INestApplication;
  const ORIGEN_PANEL = "http://localhost:5173";
  const ORIGEN_NO_PERMITIDO = "http://evil.example";

  beforeAll(async () => {
    vi.stubEnv("PANEL_URL", ORIGEN_PANEL);
    vi.stubEnv("PORTAL_URL", "http://localhost:5174");

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    // Fidelidad con `main.ts`: mismo helmet (con la excepción explícita de CORP), mismo CORS,
    // mismo filtro global, mismos pipes y mismo prefijo versionado.
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.enableCors(crearCorsOptions());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new SanitizePipe(), crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("responde el preflight OPTIONS /v1/auth/login con Access-Control-Allow-Origin + Allow-Credentials para el panel", async () => {
    const respuesta = await request(app.getHttpServer())
      .options("/v1/auth/login")
      .set("Origin", ORIGEN_PANEL)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(respuesta.status).toBeLessThan(300);
    expect(respuesta.headers["access-control-allow-origin"]).toBe(ORIGEN_PANEL);
    expect(respuesta.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("una respuesta real (no preflight) también trae los headers CORS para un origen permitido", async () => {
    const respuesta = await request(app.getHttpServer()).get("/health").set("Origin", ORIGEN_PANEL);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["access-control-allow-origin"]).toBe(ORIGEN_PANEL);
    expect(respuesta.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("NO agrega Access-Control-Allow-Origin para un origen no permitido", async () => {
    const respuesta = await request(app.getHttpServer())
      .options("/v1/auth/login")
      .set("Origin", ORIGEN_NO_PERMITIDO)
      .set("Access-Control-Request-Method", "POST");

    expect(respuesta.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
