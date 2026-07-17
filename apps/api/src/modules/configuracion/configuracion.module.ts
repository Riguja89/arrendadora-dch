import { Module } from "@nestjs/common";
import { AuthUsuariosModule } from "../auth-usuarios/auth-usuarios.module";

import { CONFIGURACION_REPOSITORY } from "./domain/ports/configuracion.repository.port";
import { CONFIGURACION_QUERY } from "./domain/ports/configuracion-query.port";
import { RELOJ } from "./domain/ports/reloj.port";

import { ConfiguracionPrismaRepository } from "./infrastructure/persistence/configuracion-prisma.repository";
import { ConfiguracionQueryAdapter } from "./infrastructure/query/configuracion-query.adapter";
import { RelojSistemaAdapter } from "./infrastructure/support/reloj-sistema.adapter";

import { ObtenerConfiguracionUseCase } from "./application/use-cases/obtener-configuracion.use-case";
import { ActualizarConfiguracionUseCase } from "./application/use-cases/actualizar-configuracion.use-case";

import { ConfiguracionController } from "./infrastructure/http/configuracion.controller";

/**
 * Bounded context de soporte `configuracion` (ADR-016). Singleton `ConfiguracionSistema` (WhatsApp
 * central + plantilla + branding + imagen genérica, ADR-012/GAP-002). Administrado solo por el
 * Administrador vía `GET/PUT /admin/configuracion`; importa `AuthUsuariosModule` (Customer/Supplier,
 * DESIGN-027) para reutilizar `SessionAuthGuard`/`RolesGuard` sin duplicar la cadena de auth.
 *
 * Exporta `CONFIGURACION_QUERY` (`ConfiguracionQueryPort`): proyección de solo lectura in-process
 * para que el Portal Detalle/Contacto (downstream, Conformist) lea número/plantilla/imagen sin pegar
 * al endpoint admin ni acceder al repositorio de este contexto.
 */
@Module({
  imports: [AuthUsuariosModule],
  controllers: [ConfiguracionController],
  providers: [
    // Puertos → adaptadores de infraestructura
    { provide: CONFIGURACION_REPOSITORY, useClass: ConfiguracionPrismaRepository },
    { provide: RELOJ, useClass: RelojSistemaAdapter },

    // Casos de uso (aplicación)
    ObtenerConfiguracionUseCase,
    ActualizarConfiguracionUseCase,

    // Puerto de consulta de solo lectura para consumidores downstream (Portal)
    { provide: CONFIGURACION_QUERY, useClass: ConfiguracionQueryAdapter },
  ],
  // Se exporta SOLO el puerto de consulta de solo lectura — no el repositorio ni los casos de uso de
  // escritura. Otros contextos consumen la configuración sin exponer el aggregate completo (ADR-016).
  exports: [CONFIGURACION_QUERY],
})
export class ConfiguracionModule {}
