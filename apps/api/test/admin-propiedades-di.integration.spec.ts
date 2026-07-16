import { describe, expect, it } from "vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import configuration from "../src/config/configuration";
import { PrismaService } from "../src/prisma/prisma.service";
import { PrismaModule } from "../src/prisma/prisma.module";
import { AdminPropiedadesModule } from "../src/modules/admin-propiedades/admin-propiedades.module";
import { PropiedadesController } from "../src/modules/admin-propiedades/infrastructure/http/propiedades.controller";
import {
  AmenidadesController,
  CatalogoBaseController,
  TiposPropiedadController,
} from "../src/modules/admin-propiedades/infrastructure/http/catalogo.controller";

/**
 * Valida el cableado DI del bounded context admin-propiedades sin base de datos real: compila el
 * grafo completo (puertos→adaptadores, casos de uso inyectables y las 8 factory providers de
 * catálogo) y confirma que los 3 controllers resuelven — incluido el patrón de herencia de
 * `CatalogoBaseController` con inyección por token (Symbol). `PrismaService` se sustituye por un
 * stub: los repositorios se construyen pero no se ejecuta ninguna query en este test.
 */
describe("AdminPropiedadesModule (wiring DI)", () => {
  async function bootstrap(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        PrismaModule,
        AdminPropiedadesModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  }

  it("resuelve PropiedadesController con sus 9 casos de uso", async () => {
    const moduleRef = await bootstrap();
    const controller = moduleRef.get(PropiedadesController);
    expect(controller).toBeInstanceOf(PropiedadesController);
    await moduleRef.close();
  });

  it("resuelve los dos catálogos vía factory providers y herencia del base controller", async () => {
    const moduleRef = await bootstrap();

    const tipos = moduleRef.get(TiposPropiedadController);
    const amenidades = moduleRef.get(AmenidadesController);

    expect(tipos).toBeInstanceOf(CatalogoBaseController);
    expect(amenidades).toBeInstanceOf(CatalogoBaseController);
    // Métodos HTTP heredados del base disponibles en cada subclase concreta.
    for (const metodo of ["listar", "crear", "editar", "desactivar"] as const) {
      expect(typeof (tipos as unknown as Record<string, unknown>)[metodo]).toBe("function");
      expect(typeof (amenidades as unknown as Record<string, unknown>)[metodo]).toBe("function");
    }

    await moduleRef.close();
  });
});
