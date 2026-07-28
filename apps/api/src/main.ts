import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http/all-exceptions.filter";
import { crearValidationPipe } from "./common/http/validation-pipe.factory";
import { SanitizePipe } from "./common/http/sanitize.pipe";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // A-08 (dep-audit BUILD-036) — headers de seguridad (helmet). Config por DEFECTO: esta API
  // es un boundary 100% JSON (sin vistas HTML propias — el portal/panel son SPAs separadas), así
  // que la CSP por defecto de helmet es inerte para las respuestas (los navegadores solo la
  // aplican a documentos HTML navegados/renderizados, no a payloads JSON de fetch/XHR). No se
  // relajó ninguna directiva: no rompe cookies de sesión (helmet no toca `Set-Cookie`, eso lo
  // controla `res.cookie()` en los controllers) ni el consumo cross-origin del portal (ese
  // consumo lo gobierna CORS, no CSP/CORP — ver nota en CLAUDE.md si se habilita CORS a futuro).
  app.use(helmet());

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
