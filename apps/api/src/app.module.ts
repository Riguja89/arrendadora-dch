import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
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
    // A-08 (dep-audit BUILD-036) — rate limiting global por IP. Almacenamiento in-memory (default
    // del paquete): suficiente para el monolito de un solo proceso actual; ver limitación de
    // producción documentada en `main.ts`/CLAUDE.md si se escala a múltiples instancias.
    ThrottlerModule.forRoot([{ name: "default", ttl: seconds(60), limit: 100 }]),
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
  providers: [
    // Guard global (A-08): todo endpoint queda limitado por defecto a 100 req/min/IP; los
    // endpoints sensibles (login, contacto WhatsApp) lo sobrescriben con `@Throttle(...)`.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
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
