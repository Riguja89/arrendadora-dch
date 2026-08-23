import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http/all-exceptions.filter";
import { crearValidationPipe } from "./common/http/validation-pipe.factory";
import { SanitizePipe } from "./common/http/sanitize.pipe";
import { crearCorsOptions } from "./common/http/cors.factory";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // A-08 (dep-audit BUILD-036) — headers de seguridad (helmet). Config por DEFECTO salvo una
  // excepción explícita (`crossOriginResourcePolicy`, ver abajo): esta API es un boundary 100%
  // JSON (sin vistas HTML propias — el portal/panel son SPAs separadas), así que la CSP por
  // defecto de helmet es inerte para las respuestas (los navegadores solo la aplican a documentos
  // HTML navegados/renderizados, no a payloads JSON de fetch/XHR). No rompe cookies de sesión
  // (helmet no toca `Set-Cookie`, eso lo controla `res.cookie()` en los controllers).
  //
  // `crossOriginResourcePolicy` SÍ se relaja de forma explícita: el default de helmet
  // (`same-origin`) hace que el navegador descarte la respuesta ANTES de exponerla al SPA aunque
  // el CORS de abajo esté bien configurado — el fetch spec aplica el chequeo de Cross-Origin-
  // -Resource-Policy sobre toda respuesta cross-origin, independientemente del modo `cors`. Como
  // el panel (`PANEL_URL`) y el portal (`PORTAL_URL`) SIEMPRE consumen esta API desde otro origen
  // por diseño (ADR-004), se usa `cross-origin` — la política que helmet documenta para APIs
  // pensadas para ser consumidas cross-origin. Ninguna otra directiva de helmet se relaja.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // CORS (A-08 follow-up): el panel admin y el portal público son SPAs cross-origin que dependen
  // de la cookie de sesión (ADR-004) — `credentials: true` + lista explícita de orígenes leída de
  // env (`crearCorsOptions`, nunca `origin: true`/wildcard, que es incompatible con credentials).
  app.enableCors(crearCorsOptions());

  app.useGlobalFilters(new AllExceptionsFilter());

  // Orden importa: sanitizar ANTES de validar/transformar, para que `class-validator` (longitud,
  // formato) evalúe el valor YA sanitizado — el mismo que termina persistido (A-08).
  app.useGlobalPipes(new SanitizePipe(), crearValidationPipe());

  // Base path versionado (DESIGN-028/029: `servers: /v1`). `/health` queda fuera del
  // prefijo — convención estándar de healthcheck para balanceadores/orquestadores.
  app.setGlobalPrefix("v1", { exclude: ["health"] });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] escuchando en http://localhost:${port}`);
}

bootstrap();
