import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter";
import { crearValidationPipe } from "../src/common/http/validation-pipe.factory";
import { AuthController } from "../src/modules/auth-usuarios/infrastructure/http/auth.controller";
import { UsuariosController } from "../src/modules/auth-usuarios/infrastructure/http/usuarios.controller";
import { SessionAuthGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/roles.guard";
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

/**
 * Prueba de integración del binding HTTP → DTO → ValidationPipe (hallazgo M-01).
 *
 * Verifica que el shape del wire EXACTO del contrato DESIGN-028 (campos snake_case:
 * `password_nueva`, `password_actual`, `tamano_pagina`) NO es rechazado por el
 * `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted` + `transform`, SIN
 * `excludeExtraneousValues`) y que los valores llegan correctamente mapeados a las
 * propiedades camelCase que consumen los casos de uso.
 *
 * La preocupación de M-01 era que class-transformer copiara la clave snake_case EN
 * PARALELO al rename por `@Expose({ name })`, generando una propiedad no-whitelisted que
 * `forbidNonWhitelisted` rechazaría con 422. Este test ejercita el pipe real (mismo
 * factory que `main.ts`) para confirmar o refutar ese riesgo.
 */
describe("Binding wire snake_case → DTO camelCase (M-01)", () => {
  let app: INestApplication;

  // Mocks de los casos de uso — el foco es el boundary HTTP, no la persistencia.
  const restablecerPassword = { ejecutar: vi.fn().mockResolvedValue(undefined) };
  const cambiarPassword = { ejecutar: vi.fn().mockResolvedValue(undefined) };
  const listarUsuarios = { ejecutar: vi.fn().mockResolvedValue({ items: [], total: 0 }) };
  const noop = { ejecutar: vi.fn().mockResolvedValue(undefined) };

  // Guard de sesión simulado: inyecta un Administrador autenticado sin tocar la BD.
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
      controllers: [AuthController, UsuariosController],
      providers: [
        { provide: LoginUseCase, useValue: noop },
        { provide: LogoutUseCase, useValue: noop },
        { provide: CambiarPasswordUseCase, useValue: cambiarPassword },
        { provide: SolicitarRecuperacionPasswordUseCase, useValue: noop },
        { provide: RestablecerPasswordConTokenUseCase, useValue: restablecerPassword },
        { provide: CrearUsuarioUseCase, useValue: noop },
        { provide: ListarUsuariosUseCase, useValue: listarUsuarios },
        { provide: ObtenerUsuarioUseCase, useValue: noop },
        { provide: EditarUsuarioUseCase, useValue: noop },
        { provide: CambiarEstadoUsuarioUseCase, useValue: noop },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionGuardStub)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    // Mismo filtro y pipe global que main.ts — fidelidad de comportamiento.
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /v1/auth/reset-password acepta `password_nueva` y lo mapea a passwordNueva", async () => {
    const respuesta = await request(app.getHttpServer())
      .post("/v1/auth/reset-password")
      .send({ token: "tok-123", password_nueva: "Passw0rd!" });

    expect(respuesta.status).toBe(204);
    expect(restablecerPassword.ejecutar).toHaveBeenCalledWith({
      tokenPlano: "tok-123",
      passwordNueva: "Passw0rd!",
    });
  });

  it("POST /v1/auth/change-password acepta `password_actual` y `password_nueva` mapeados", async () => {
    const respuesta = await request(app.getHttpServer())
      .post("/v1/auth/change-password")
      .send({ password_actual: "Vieja123", password_nueva: "Nueva123!" });

    expect(respuesta.status).toBe(204);
    expect(cambiarPassword.ejecutar).toHaveBeenCalledWith({
      usuarioId: "admin-1",
      passwordActual: "Vieja123",
      passwordNueva: "Nueva123!",
    });
  });

  it("GET /v1/admin/usuarios acepta `tamano_pagina` y lo mapea (transformado a número) a tamanoPagina", async () => {
    const respuesta = await request(app.getHttpServer())
      .get("/v1/admin/usuarios")
      .query({ tamano_pagina: "10", pagina: "1" });

    expect(respuesta.status).toBe(200);
    expect(listarUsuarios.ejecutar).toHaveBeenCalledWith({
      estado: undefined,
      rol: undefined,
      pagina: 1,
      tamanoPagina: 10,
    });
    const [args] = listarUsuarios.ejecutar.mock.calls.at(-1) ?? [];
    expect(typeof args.pagina).toBe("number");
    expect(typeof args.tamanoPagina).toBe("number");
  });

  it("GET /v1/admin/usuarios con `tamano_pagina` fuera de rango reporta `campo: tamano_pagina` (D-004, ADR-015)", async () => {
    const respuesta = await request(app.getHttpServer())
      .get("/v1/admin/usuarios")
      .query({ tamano_pagina: "101" });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.detalles).toEqual([
      expect.objectContaining({
        campo: "tamano_pagina",
        mensaje: "El tamaño de página no puede ser mayor a 100.",
      }),
    ]);
  });

  it("control negativo: el pipe SÍ es estricto — un campo desconocido produce 422", async () => {
    const respuesta = await request(app.getHttpServer())
      .post("/v1/auth/reset-password")
      .send({ token: "tok-123", password_nueva: "Passw0rd!", campo_desconocido: "x" });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toBe("UNPROCESSABLE_ENTITY");
  });
});
