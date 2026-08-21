import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AntibotConfig } from "../../../../config/configuration";
import type {
  ResultadoAntibot,
  VerificadorAntibotPort,
} from "../../domain/ports/verificador-antibot.port";

/** Forma parcial de la respuesta de `siteverify` de Google reCAPTCHA v3 que nos interesa. */
interface RespuestaSiteverify {
  success?: boolean;
  score?: number;
}

/**
 * Adaptador de producción del `VerificadorAntibotPort` (ADR-007): verifica el token de reCAPTCHA v3
 * server-side contra la API `siteverify` de Google usando la **clave secreta** (por env, nunca en el
 * repo). Encapsula la comparación contra el umbral de score configurable — el puerto devuelve el
 * veredicto ya resuelto.
 *
 * Semántica de resultado (contrato DESIGN-029):
 * - Excepción de red / clave secreta ausente → `disponible: false` → el caso de uso responde 503
 *   (RN-003): el portal no expone el enlace sin validación.
 * - `success: false` (token inválido/expirado) o `score < umbral` → `aprobado: false` → 403.
 * - `success: true` y `score ≥ umbral` → `aprobado: true`.
 */
@Injectable()
export class RecaptchaVerificadorAdapter implements VerificadorAntibotPort {
  private readonly logger = new Logger(RecaptchaVerificadorAdapter.name);
  private readonly config: AntibotConfig;

  constructor(configService: ConfigService) {
    this.config = configService.get<AntibotConfig>("antibot") ?? {
      driver: "recaptcha",
      recaptchaSecret: "",
      scoreMinimo: 0.5,
      verifyUrl: "https://www.google.com/recaptcha/api/siteverify",
      verifyTimeoutMs: 7000,
    };
  }

  async verificar(token: string): Promise<ResultadoAntibot> {
    if (!this.config.recaptchaSecret) {
      // Sin clave secreta no se puede validar: se trata como servicio no disponible (503), nunca
      // como aprobación. El operador debe configurar RECAPTCHA_SECRET_KEY.
      this.logger.error("[antibot:recaptcha] falta RECAPTCHA_SECRET_KEY — no se puede validar");
      return { disponible: false, aprobado: false, score: null };
    }

    let datos: RespuestaSiteverify;
    try {
      const cuerpo = new URLSearchParams({ secret: this.config.recaptchaSecret, response: token });
      // Timeout explícito (RECAPTCHA_VERIFY_TIMEOUT_MS, default 7s): sin esto, una red móvil
      // lenta puede dejar el fetch colgado hasta el timeout del socket del OS (~2 min) antes de
      // caer en el catch de abajo. Con AbortSignal.timeout, el mismo camino fail-closed (ADR-007)
      // se alcanza rápido — no cambia la política de seguridad, solo la latencia del fallo.
      const respuesta = await fetch(this.config.verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: cuerpo.toString(),
        signal: AbortSignal.timeout(this.config.verifyTimeoutMs),
      });
      if (!respuesta.ok) {
        this.logger.error(`[antibot:recaptcha] siteverify respondió HTTP ${respuesta.status}`);
        return { disponible: false, aprobado: false, score: null };
      }
      datos = (await respuesta.json()) as RespuestaSiteverify;
    } catch (error) {
      this.logger.error(`[antibot:recaptcha] error de red al invocar siteverify: ${String(error)}`);
      return { disponible: false, aprobado: false, score: null };
    }

    const score = typeof datos.score === "number" ? datos.score : null;
    const aprobado = datos.success === true && score !== null && score >= this.config.scoreMinimo;
    return { disponible: true, aprobado, score };
  }
}
