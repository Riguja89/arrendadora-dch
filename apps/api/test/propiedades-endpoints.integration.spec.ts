import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter";
import { crearValidationPipe } from "../src/common/http/validation-pipe.factory";
import { PropiedadesController } from "../src/modules/admin-propiedades/infrastructure/http/propiedades.controller";
import { CrearPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/crear-propiedad.use-case";
import { EditarPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/editar-propiedad.use-case";
import { ListarPropiedadesUseCase } from "../src/modules/admin-propiedades/application/use-cases/listar-propiedades.use-case";
import { ObtenerPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/obtener-propiedad.use-case";
import { CambiarEstadoPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/cambiar-estado-propiedad.use-case";
import { DuplicarPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/duplicar-propiedad.use-case";
import { ArchivarPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/archivar-propiedad.use-case";
import { RestaurarPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/restaurar-propiedad.use-case";
import { ListarHistorialUseCase } from "../src/modules/admin-propiedades/application/use-cases/listar-historial.use-case";
import { EstablecerUbicacionPropiedadUseCase } from "../src/modules/admin-propiedades/application/use-cases/establecer-ubicacion-propiedad.use-case";
import { Propiedad } from "../src/modules/admin-propiedades/domain/entities/propiedad.entity";
import { Coordenadas } from "../src/modules/admin-propiedades/domain/value-objects/coordenadas.vo";
import {
  PropiedadNoEncontradaError,
  UbicacionModoInvalidoError,
} from "../src/modules/admin-propiedades/domain/errors/dominio-propiedades.errors";
import { SessionAuthGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../src/modules/auth-usuarios/infrastructure/http/guards/roles.guard";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadConUbicacion(): Propiedad {
  const p = Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: "Calle 63 #10-20",
    precio: 1_000_000, area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null,
    destacada: false, agenteId: "agente-1", amenidades: [], ahora: AHORA,
  });
  p.establecerUbicacion(Coordenadas.crear(4.710989, -74.072092), AHORA);
  return p;
}

/**
 * Integración HTTP de PUT /admin/propiedades/{id}/ubicacion (D-005, RN-033, contrato
 * DESIGN-028). Ejercita el pipe + guards + filtro de excepciones reales; el caso de uso se
 * mockea (su lógica de negocio ya está cubierta por
 * `establecer-ubicacion-propiedad.use-case.spec.ts`) — mismo criterio que
 * `dto-wire-binding.integration.spec.ts`.
 */
describe("PUT /admin/propiedades/:id/ubicacion (D-005, RN-033)", () => {
  let app: INestApplication;

  const establecerUbicacion = { ejecutar: vi.fn() };
  const archivar = { ejecutar: vi.fn() };
  const restaurar = { ejecutar: vi.fn() };
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
      controllers: [PropiedadesController],
      providers: [
        { provide: CrearPropiedadUseCase, useValue: noop },
        { provide: EditarPropiedadUseCase, useValue: noop },
        { provide: ListarPropiedadesUseCase, useValue: noop },
        { provide: ObtenerPropiedadUseCase, useValue: noop },
        { provide: CambiarEstadoPropiedadUseCase, useValue: noop },
        { provide: DuplicarPropiedadUseCase, useValue: noop },
        { provide: ArchivarPropiedadUseCase, useValue: archivar },
        { provide: RestaurarPropiedadUseCase, useValue: restaurar },
        { provide: ListarHistorialUseCase, useValue: noop },
        { provide: EstablecerUbicacionPropiedadUseCase, useValue: establecerUbicacion },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionGuardStub)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    establecerUbicacion.ejecutar.mockReset();
    archivar.ejecutar.mockReset();
    restaurar.ejecutar.mockReset();
  });

  it("feliz — modo manual: 200 con { latitud, longitud } y mapea el body al caso de uso", async () => {
    establecerUbicacion.ejecutar.mockResolvedValueOnce(propiedadConUbicacion());

    const respuesta = await request(app.getHttpServer())
      .put("/v1/admin/propiedades/prop-1/ubicacion")
      .send({ latitud: 4.710989, longitud: -74.072092 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ latitud: 4.710989, longitud: -74.072092 });
    expect(establecerUbicacion.ejecutar).toHaveBeenCalledWith({
      actor: { id: "admin-1", rol: "administrador" },
      id: "prop-1",
      latitud: 4.710989,
      longitud: -74.072092,
      geocodificarDireccion: undefined,
    });
  });

  it("feliz — modo geocodificar: 200 y geocodificarDireccion=true llega al caso de uso", async () => {
    establecerUbicacion.ejecutar.mockResolvedValueOnce(propiedadConUbicacion());

    const respuesta = await request(app.getHttpServer())
      .put("/v1/admin/propiedades/prop-1/ubicacion")
      .send({ geocodificar_direccion: true });

    expect(respuesta.status).toBe(200);
    expect(establecerUbicacion.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ geocodificarDireccion: true, latitud: undefined, longitud: undefined }),
    );
  });

  it("422 por exclusión mutua (RN-033) cuando el caso de uso rechaza ambos modos a la vez", async () => {
    establecerUbicacion.ejecutar.mockRejectedValueOnce(new UbicacionModoInvalidoError());

    const respuesta = await request(app.getHttpServer())
      .put("/v1/admin/propiedades/prop-1/ubicacion")
      .send({ latitud: 4.7, longitud: -74.1, geocodificar_direccion: true });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toBe("UNPROCESSABLE_ENTITY");
    expect(respuesta.body.detalles).toEqual([
      expect.objectContaining({ campo: "geocodificar_direccion" }),
    ]);
  });

  it("404 cuando la propiedad no existe", async () => {
    establecerUbicacion.ejecutar.mockRejectedValueOnce(new PropiedadNoEncontradaError());

    const respuesta = await request(app.getHttpServer())
      .put("/v1/admin/propiedades/no-existe/ubicacion")
      .send({ latitud: 4.7, longitud: -74.1 });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toBe("NOT_FOUND");
  });

  it("422 en el borde del pipe (DTO) cuando latitud excede el rango válido — campo snake_case (D-004)", async () => {
    const respuesta = await request(app.getHttpServer())
      .put("/v1/admin/propiedades/prop-1/ubicacion")
      .send({ latitud: 200, longitud: -74.1 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.detalles).toEqual([
      expect.objectContaining({ campo: "latitud" }),
    ]);
    expect(establecerUbicacion.ejecutar).not.toHaveBeenCalled();
  });
});

/**
 * D-006 — `POST .../archivar` y `POST .../restaurar` devolvían 201 (default de Nest para
 * `@Post`) en lugar del 200 que declara el contrato (DESIGN-028). Ningún test existente
 * verificaba el status code de estos dos endpoints — se reutiliza el mismo harness HTTP de
 * `PropiedadesController` de arriba (mismo describe file, controller ya montado).
 */
describe("POST /admin/propiedades/:id/{archivar,restaurar} (D-006)", () => {
  let app: INestApplication;
  const archivar = { ejecutar: vi.fn() };
  const restaurar = { ejecutar: vi.fn() };
  const noop = { ejecutar: vi.fn().mockResolvedValue(undefined) };

  const sessionGuardStub = {
    canActivate: (context: ExecutionContext): boolean => {
      const req = context.switchToHttp().getRequest();
      req.usuario = { id: "admin-1", rol: "administrador" };
      req.sesionId = "sesion-1";
      return true;
    },
  };

  function propiedadBase(): Propiedad {
    return Propiedad.crear({
      id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
      tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
      area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
      agenteId: "agente-1", amenidades: [], ahora: AHORA,
    });
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PropiedadesController],
      providers: [
        { provide: CrearPropiedadUseCase, useValue: noop },
        { provide: EditarPropiedadUseCase, useValue: noop },
        { provide: ListarPropiedadesUseCase, useValue: noop },
        { provide: ObtenerPropiedadUseCase, useValue: noop },
        { provide: CambiarEstadoPropiedadUseCase, useValue: noop },
        { provide: DuplicarPropiedadUseCase, useValue: noop },
        { provide: ArchivarPropiedadUseCase, useValue: archivar },
        { provide: RestaurarPropiedadUseCase, useValue: restaurar },
        { provide: ListarHistorialUseCase, useValue: noop },
        { provide: EstablecerUbicacionPropiedadUseCase, useValue: noop },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionGuardStub)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(crearValidationPipe());
    app.setGlobalPrefix("v1", { exclude: ["health"] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST .../archivar responde 200 (no 201)", async () => {
    archivar.ejecutar.mockResolvedValueOnce(propiedadBase());
    const respuesta = await request(app.getHttpServer()).post("/v1/admin/propiedades/prop-1/archivar");
    expect(respuesta.status).toBe(200);
  });

  it("POST .../restaurar responde 200 (no 201)", async () => {
    restaurar.ejecutar.mockResolvedValueOnce(propiedadBase());
    const respuesta = await request(app.getHttpServer()).post("/v1/admin/propiedades/prop-1/restaurar");
    expect(respuesta.status).toBe(200);
  });
});
