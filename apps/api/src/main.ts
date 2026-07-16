import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http/all-exceptions.filter";
import { crearValidationPipe } from "./common/http/validation-pipe.factory";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(crearValidationPipe());

  // Base path versionado (DESIGN-028/029: `servers: /v1`). `/health` queda fuera del
  // prefijo — convención estándar de healthcheck para balanceadores/orquestadores.
  app.setGlobalPrefix("v1", { exclude: ["health"] });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] escuchando en http://localhost:${port}`);
}

bootstrap();
