import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle, seconds } from "@nestjs/throttler";
import type { AppConfig } from "../../../../config/configuration";
import { ObtenerFichaPorSlugUseCase } from "../../application/use-cases/obtener-ficha-por-slug.use-case";
import { GenerarContactoWhatsappUseCase } from "../../application/use-cases/generar-contacto-whatsapp.use-case";
import { ContactoWhatsappDto } from "./dto/contacto-whatsapp.dto";
import {
  aPropiedadDetalleWire,
  type ContactoWhatsappWire,
  type PropiedadDetalleWire,
} from "./mappers/detalle.mapper";

/**
 * Cara pública de la ficha de detalle y el contacto (ANALYZE-002, contrato DESIGN-029). Endpoints
 * ANÓNIMOS — NO llevan `SessionAuthGuard`/`RolesGuard`: la ficha es pública por diseño y el
 * anti-bot NO es autenticación (RN-009: la validación aplica solo al contacto, no a la navegación).
 * El envelope de error y el `correlation_id` los aplican el `AllExceptionsFilter` y el
 * `CorrelationIdMiddleware` globales (ADR-015, DEI-003). El prefijo `/v1` lo pone el bootstrap.
 *
 * La visibilidad pública (RN-025) la impone SIEMPRE el repositorio; una propiedad no visible
 * responde 404 idéntico a un slug inexistente (no revela enumeración).
 */
@Controller("public")
export class PortalDetalleController {
  constructor(
    private readonly obtenerFicha: ObtenerFichaPorSlugUseCase,
    private readonly generarContacto: GenerarContactoWhatsappUseCase,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** CU-001 (HU-001, HU-002) — ficha completa por slug: datos, galería, mapa (aprox.) y Open Graph. */
  @Get("propiedades/:slug")
  async ficha(@Param("slug") slug: string): Promise<PropiedadDetalleWire> {
    const ficha = await this.obtenerFicha.ejecutar({
      slug,
      portalBaseUrl: this.config.get("portalUrl", { infer: true }),
    });
    return aPropiedadDetalleWire(ficha);
  }

  /**
   * CU-002 (HU-003) — genera el deep link de WhatsApp tras validar el anti-bot (ADR-007). 200 con
   * `{ deep_link }` si aprueba; 403 si rechaza; 503 si el anti-bot no está disponible (RN-003); 404
   * si la propiedad no es visible (RN-025). Los status los emiten los errores de dominio (ADR-015).
   */
  /**
   * Rate-limit reforzado (A-08): 10 intentos/min por IP. El anti-bot (reCAPTCHA v3, ADR-007) ya
   * filtra tráfico automatizado por score, pero es probabilístico y no acota el COSTO de llamar
   * repetidamente a `siteverify` (Google) ni el volumen de deep links generados — el throttler
   * agrega un techo duro, complementario, sin depender del veredicto del anti-bot.
   */
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @Post("propiedades/:slug/contacto-whatsapp")
  @HttpCode(HttpStatus.OK)
  async contactoWhatsapp(
    @Param("slug") slug: string,
    @Body() dto: ContactoWhatsappDto,
  ): Promise<ContactoWhatsappWire> {
    const resultado = await this.generarContacto.ejecutar({
      slug,
      recaptchaToken: dto.recaptcha_token,
    });
    return { deep_link: resultado.deepLink };
  }
}
