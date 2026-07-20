import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from "./app.controller";
import { CorrelationIdMiddleware } from "./common/http/correlation-id.middleware";
import { PortalCatalogoModule } from "./modules/portal-catalogo/portal-catalogo.module";
import { PortalDetalleModule } from "./modules/portal-detalle/portal-detalle.module";
import { AdminPropiedadesModule } from "./modules/admin-propiedades/admin-propiedades.module";
import { AdminMultimediaModule } from "./modules/admin-multimedia/admin-multimedia.module";
import { AuthUsuariosModule } from "./modules/auth-usuarios/auth-usuarios.module";
import { ConfiguracionModule } from "./modules/configuracion/configuracion.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    // Los 5 bounded contexts del monolito modular hexagonal (ADR-001, DESIGN-027).
    PortalCatalogoModule,
    PortalDetalleModule,
    AdminPropiedadesModule,
    AdminMultimediaModule,
    AuthUsuariosModule,
    // Contexto de soporte: configuración del sistema (singleton, ADR-016).
    ConfiguracionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * Registra `CorrelationIdMiddleware` para TODAS las rutas (DEI-003, ADR-015): asegura que
   * `request.correlationId` esté resuelto antes de cualquier controller o del
   * `AllExceptionsFilter`, propagando el `X-Correlation-ID` entrante o generando uno nuevo en
   * el boundary de entrada.
   */
  configure(consumer: MiddlewareConsumer): void {
    // Express 5 / path-to-regexp v8 (NestJS 11): el wildcard sin nombre `"*"` ya no es válido.
    // `"{*path}"` es el comodín con nombre que cubre todas las rutas, incluida la raíz.
    consumer.apply(CorrelationIdMiddleware).forRoutes("{*path}");
  }
}
