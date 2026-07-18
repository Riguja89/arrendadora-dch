import { Inject, Injectable } from "@nestjs/common";
import {
  CONFIGURACION_QUERY,
  type ConfiguracionQueryPort,
} from "../../../configuracion/domain/ports/configuracion-query.port";
import {
  PROPIEDAD_DETALLE_REPOSITORY,
  type PropiedadDetalleRepositoryPort,
} from "../../domain/ports/propiedad-detalle.repository.port";
import {
  VERIFICADOR_ANTIBOT,
  type VerificadorAntibotPort,
} from "../../domain/ports/verificador-antibot.port";
import { construirDeepLinkWhatsapp } from "../../domain/rules/deep-link-whatsapp";
import {
  ContactoRechazadoError,
  PropiedadNoEncontradaError,
  ServicioAntibotNoDisponibleError,
} from "../../domain/errors/dominio-detalle.errors";

export interface ParametrosContacto {
  slug: string;
  /** Token de reCAPTCHA v3 generado por el cliente (ADR-007). */
  recaptchaToken: string;
}

export interface ResultadoContacto {
  /** Deep link `wa.me` listo para abrir la conversación con el número central (ADR-012). */
  deepLink: string;
}

/**
 * CU-002 (HU-003) — Iniciar el contacto con el agente por WhatsApp desde la ficha (RN-004, RN-003).
 * Orden inviolable del flujo (spec-002 CU-002):
 *
 * 1. Resolver la propiedad por `slug` aplicando la visibilidad pública (RN-025). No visible → 404.
 * 2. Verificar el anti-bot server-side (ADR-007) ANTES de exponer cualquier enlace:
 *    - Servicio no disponible → `ServicioAntibotNoDisponibleError` (503, RN-003). Nunca se genera el
 *      enlace sin validación.
 *    - Rechazado (score bajo el umbral) → `ContactoRechazadoError` (403). El visitante puede reintentar.
 * 3. Construir el deep link con el número central y la plantilla configurados (ADR-012, GAP-002),
 *    interpolando el `{codigo}` de la propiedad (RN-004).
 *
 * Nota (ADR-012, Modelo B): el número es SIEMPRE el central de la inmobiliaria. La spec-002 (RN-022)
 * proponía número por agente con fallback central; el cliente resolvió el número central único en
 * GAP-001/GAP-002 (ADR-012) — desviación documentada en el CLAUDE.md del módulo.
 */
@Injectable()
export class GenerarContactoWhatsappUseCase {
  constructor(
    @Inject(PROPIEDAD_DETALLE_REPOSITORY)
    private readonly propiedades: PropiedadDetalleRepositoryPort,
    @Inject(VERIFICADOR_ANTIBOT) private readonly antibot: VerificadorAntibotPort,
    @Inject(CONFIGURACION_QUERY) private readonly configuracion: ConfiguracionQueryPort,
  ) {}

  async ejecutar(parametros: ParametrosContacto): Promise<ResultadoContacto> {
    const propiedad = await this.propiedades.obtenerPorSlug(parametros.slug);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }

    const verificacion = await this.antibot.verificar(parametros.recaptchaToken);
    if (!verificacion.disponible) {
      throw new ServicioAntibotNoDisponibleError();
    }
    if (!verificacion.aprobado) {
      throw new ContactoRechazadoError();
    }

    const config = await this.configuracion.obtenerConfiguracionPublica();
    const deepLink = construirDeepLinkWhatsapp(
      config.whatsappNumeroCentral,
      config.whatsappPlantillaMensaje,
      propiedad.codigo,
    );

    return { deepLink };
  }
}
