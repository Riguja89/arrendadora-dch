import { Injectable, Logger } from "@nestjs/common";
import type {
  ResultadoAntibot,
  VerificadorAntibotPort,
} from "../../domain/ports/verificador-antibot.port";

/**
 * Adaptador **stub/dev** del `VerificadorAntibotPort` (ADR-007) — MVP/dev/tests SIN credenciales de
 * Google. Por defecto aprueba toda solicitud, y expone convenciones de token para que el QA pueda
 * ejercitar los flujos de excepción manualmente sin un reCAPTCHA real:
 *
 * - token que contiene `reject`      → rechazado (simula score bajo → 403).
 * - token que contiene `unavailable` → servicio no disponible (simula caída → 503, RN-003).
 * - cualquier otro                   → aprobado.
 *
 * Reemplazable por `RecaptchaVerificadorAdapter` cambiando solo el binding del módulo (env
 * `ANTIBOT_DRIVER=recaptcha`), sin tocar dominio ni casos de uso. Mismo patrón que
 * `LocalAlmacenamientoAdapter` (storage) y `LogEmailSenderAdapter` (email).
 */
@Injectable()
export class StubVerificadorAdapter implements VerificadorAntibotPort {
  private readonly logger = new Logger(StubVerificadorAdapter.name);

  async verificar(token: string): Promise<ResultadoAntibot> {
    const normalizado = token.toLowerCase();
    if (normalizado.includes("unavailable")) {
      this.logger.warn("[antibot:stub] servicio simulado como NO disponible (token de prueba)");
      return { disponible: false, aprobado: false, score: null };
    }
    if (normalizado.includes("reject")) {
      this.logger.warn("[antibot:stub] solicitud simulada como RECHAZADA (token de prueba)");
      return { disponible: true, aprobado: false, score: 0 };
    }
    this.logger.log("[antibot:stub] verificación omitida — aprobado por defecto (dev, ADR-007 MVP)");
    return { disponible: true, aprobado: true, score: 1 };
  }
}
