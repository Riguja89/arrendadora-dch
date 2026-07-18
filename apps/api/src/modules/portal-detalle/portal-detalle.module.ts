import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AntibotConfig } from "../../config/configuration";
import { AdminMultimediaModule } from "../admin-multimedia/admin-multimedia.module";
import { ConfiguracionModule } from "../configuracion/configuracion.module";

import { PROPIEDAD_DETALLE_REPOSITORY } from "./domain/ports/propiedad-detalle.repository.port";
import { VERIFICADOR_ANTIBOT } from "./domain/ports/verificador-antibot.port";
import { PropiedadDetallePrismaRepository } from "./infrastructure/persistence/propiedad-detalle-prisma.repository";
import { RecaptchaVerificadorAdapter } from "./infrastructure/antibot/recaptcha-verificador.adapter";
import { StubVerificadorAdapter } from "./infrastructure/antibot/stub-verificador.adapter";

import { ObtenerFichaPorSlugUseCase } from "./application/use-cases/obtener-ficha-por-slug.use-case";
import { GenerarContactoWhatsappUseCase } from "./application/use-cases/generar-contacto-whatsapp.use-case";

import { PortalDetalleController } from "./infrastructure/http/portal-detalle.controller";

/**
 * 2. Portal Público — Detalle y Contacto (ANALYZE-002, contrato DESIGN-029). Cara pública SIN
 * autenticación: ficha de propiedad por slug (solo lectura) + generación del deep link de WhatsApp
 * tras validar el anti-bot (reCAPTCHA v3, ADR-007). Arquitectura hexagonal (ADR-001), dominio puro.
 *
 * Endpoints (DESIGN-029): GET /public/propiedades/{slug},
 * POST /public/propiedades/{slug}/contacto-whatsapp.
 *
 * Acoplamientos cross-BC (in-process, DESIGN-027):
 * - Importa `AdminMultimediaModule` para consumir `MULTIMEDIA_QUERY` (galería de fotos, RN-014).
 * - Importa `ConfiguracionModule` para consumir `CONFIGURACION_QUERY` (número/plantilla de WhatsApp
 *   e imagen genérica de fallback para el og:image, ADR-012/RN-008).
 * - Lee la tabla `propiedades` directamente vía `PropiedadDetallePrismaRepository` (DESVIACIÓN
 *   CORE-006 acotada a lectura — `admin-propiedades` aún no expone query-port público, ver CLAUDE.md).
 *
 * Selección de anti-bot (ADR-007): factory por env `ANTIBOT_DRIVER`. `recaptcha` (con clave secreta
 * presente) → `RecaptchaVerificadorAdapter`; en cualquier otro caso → `StubVerificadorAdapter`
 * (dev/tests, sin credenciales). Mismo patrón de selección por config que el storage de multimedia.
 */
@Module({
  imports: [AdminMultimediaModule, ConfiguracionModule],
  controllers: [PortalDetalleController],
  providers: [
    // Puerto → adaptador de infraestructura (solo lectura)
    { provide: PROPIEDAD_DETALLE_REPOSITORY, useClass: PropiedadDetallePrismaRepository },

    // Puerto anti-bot → adaptador seleccionado por config (recaptcha en prod, stub en dev/tests)
    {
      provide: VERIFICADOR_ANTIBOT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const antibot = config.get<AntibotConfig>("antibot");
        return antibot?.driver === "recaptcha" && antibot.recaptchaSecret
          ? new RecaptchaVerificadorAdapter(config)
          : new StubVerificadorAdapter();
      },
    },

    // Casos de uso (aplicación)
    ObtenerFichaPorSlugUseCase,
    GenerarContactoWhatsappUseCase,
  ],
})
export class PortalDetalleModule {}
