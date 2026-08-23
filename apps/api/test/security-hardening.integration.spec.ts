import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter";
import { crearValidationPipe } from "../src/common/http/validation-pipe.factory";
import { SanitizePipe } from "../src/common/http/sanitize.pipe";
import { AuthController } from "../src/modules/auth-usuarios/infrastructure/http/auth.controller";
import { UsuariosController } from "../src/modules/auth-usuarios/infrastructure/http/usuarios.controller";
import { LoginUseCase } from "../src/modules/auth-usuarios/application/use-cases/login.use-case";
import { LogoutUseCase } from "../src/modules/auth-usuarios/application/use-cases/logout.use-case";
import { CambiarPasswordUseCase } from "../src/modules/auth-usuarios/application/use-cases/cambiar-password.use-case";
import { SolicitarRecuperacionPasswordUseCase } from "../src/modules/auth-usuarios/application/use-cases/solicitar-recuperacion-password.use-case";
import { RestablecerPasswordConTokenUseCase } from "../src/modules/auth-usuarios/application/use-cases/restablecer-password-con-token.use-case";
import { CrearUsuarioUseCase } from "../src/modules/auth-usuarios/application/use-cases/crear-usuario.use-case";
import { ListarUsuariosUseCase } from "../src/modules/auth-usuarios/application/use-cases/listar-usuarios.use-case";
import { ObtenerUsuarioUseCase } from "../src/modules/auth-usuarios/application/use-cases/obtener-usuario.use-case";
import { EditarUsuarioUseCase } from "../src/modules/auth-usuarios/application/use-cases/editar-usuario.use-case";
import { CambiarEstadoUsuarioUseCase } from "../src/modules/auth-usuarios/application/use-cases/cambiar-estado-usuario.use-case";
import { SessionAuthGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/roles.guard";
import { CredencialesInvalidasError } from "../src/modules/auth-usuarios/domain/errors/dominio-auth.errors";
import { Usuario } from "../src/modules/auth-usuarios/domain/entities/usuario.entity";

/**
 * Integración A-08 (dep-audit BUILD-036) — throttler (429 tras exceder el límite reforzado de
 * `POST /auth/login`, 5/min/IP) y sanitización end-to-end (el pipe corre ANTES del ValidationPipe
 * real, sobre el `AuthController`/`UsuariosController` reales, no una unidad aislada).
 */
describe("Throttler — POST /auth/login (A-08)", () => {
  let app: INestApplication;
  const loginUseCase = { ejecutar: vi.fn() };
  const noop = { ejecutar: vi.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      // Mismo límite global (100/min) que `AppModule` — el override de 5/min vive en el
      // `@Throttle()` del propio `AuthController.login`, así que se ejercita igual acá.
      imports: [ThrottlerModule.forRoot([{ name: "default", ttl: seconds(60), limit: 100 }])],
      controllers: [AuthController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: LogoutUseCase, useValue: noop },
        { provide: CambiarPasswordUseCase, useValue: noop },
        { provide: SolicitarRecuperacionPasswordUseCase, useValue: noop },
        { provide: RestablecerPasswordConTokenUseCase, useValue: noop },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    })
      // `logout`/`change-password` del mismo controller usan `@UseGuards(SessionAuthGuard)` — Nest
      // resuelve el grafo completo del controller en `app.init()` aunque el test solo pegue a
      // `login`, así que el guard debe poder instanciarse (o quedar sobreescrito) igual.
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new SanitizePipe(), crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("responde 429 en el 6º intento de login dentro de la misma ventana (límite: 5/min)", async () => {
    loginUseCase.ejecutar.mockRejectedValue(new CredencialesInvalidasError());
    const server = app.getHttpServer();
    const body = { email: "x@x.com", password: "incorrecta" };

    const respuestas = [];
    for (let i = 0; i < 6; i++) {
      respuestas.push(await request(server).post("/v1/auth/login").send(body));
    }

    const [primeras5, sexta] = [respuestas.slice(0, 5), respuestas[5]];
    for (const r of primeras5) {
      expect(r.status).toBe(401); // CredencialesInvalidasError — el throttler todavía no cortó.
    }
    expect(sexta.status).toBe(429);
  });
});

describe("Sanitización end-to-end — POST /admin/usuarios (A-08)", () => {
  let app: INestApplication;
  const usuarioCreado = Usuario.crear({
    id: "u-1", nombre: "n", email: "e@e.com", passwordHash: "hash", rol: "agente",
    whatsapp: null, ahora: new Date("2026-07-01T10:00:00.000Z"),
  });
  const crearUsuarioUseCase = {
    ejecutar: vi.fn().mockResolvedValue({ usuario: usuarioCreado, passwordTemporal: "Temp1234" }),
  };
  const noop = { ejecutar: vi.fn().mockResolvedValue(undefined) };

  const sessionGuardStub = {
    canActivate: (context: ExecutionContext): boolean => {
      const req = context.switchToHttp().getRequest();
      req.usuario = { id: "admin-1", rol: "administrador" };
      req.sesionId = "sesion-1";
      return true;
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        { provide: CrearUsuarioUseCase, useValue: crearUsuarioUseCase },
        { provide: ListarUsuariosUseCase, useValue: noop },
        { provide: ObtenerUsuarioUseCase, useValue: noop },
        { provide: EditarUsuarioUseCase, useValue: noop },
        { provide: CambiarEstadoUsuarioUseCase, useValue: noop },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionGuardStub)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new SanitizePipe(), crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("limpia un <script> inyectado en `nombre` antes de que llegue al caso de uso", async () => {
    const respuesta = await request(app.getHttpServer())
      .post("/v1/admin/usuarios")
      .send({
        nombre: '  <script>alert("xss")</script>Ana Torres  ',
        email: "ana@arrendadora.com",
        rol: "agente",
      });

    expect(respuesta.status).toBe(201);
    expect(crearUsuarioUseCase.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Ana Torres" }),
    );
  });

  it("preserva texto legítimo con `&` sin convertirlo en entidad HTML", async () => {
    crearUsuarioUseCase.ejecutar.mockClear();
    const respuesta = await request(app.getHttpServer())
      .post("/v1/admin/usuarios")
      .send({ nombre: "Juan & Asociados", email: "juan@arrendadora.com", rol: "editor" });

    expect(respuesta.status).toBe(201);
    expect(crearUsuarioUseCase.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Juan & Asociados" }),
    );
  });
});
