import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from "./app.controller";
import { PortalCatalogoModule } from "./modules/portal-catalogo/portal-catalogo.module";
import { PortalDetalleModule } from "./modules/portal-detalle/portal-detalle.module";
import { AdminPropiedadesModule } from "./modules/admin-propiedades/admin-propiedades.module";
import { AdminMultimediaModule } from "./modules/admin-multimedia/admin-multimedia.module";
import { AuthUsuariosModule } from "./modules/auth-usuarios/auth-usuarios.module";

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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
