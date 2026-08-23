import { Injectable, Logger } from "@nestjs/common";
import type { FormatoImagen } from "../../domain/value-objects/formato-imagen.vo";
import { CONTENT_TYPE_POR_FORMATO } from "../../domain/value-objects/formato-imagen.vo";
import type { ObjetoVariante } from "../../domain/ports/almacenamiento-objetos.port";
import type { OptimizadorImagenesPort } from "../../domain/ports/optimizador-imagenes.port";
import { VARIANTES_IMAGEN } from "../../domain/rules/multimedia-constantes";

/**
 * Adaptador de optimización **passthrough** para dev/MVP (RN-006). Genera las tres variantes
 * (original, card, thumbnail) referenciando el binario original SIN redimensionar ni comprimir —
 * suficiente para que el flujo de carga funcione end-to-end sin dependencias nativas.
 *
 * La implementación de producción es un adaptador con **Sharp** (ADR-008) que compone las variantes
 * responsive a 1920×1080 / card / thumbnail en WEBP. No se agregó `sharp` en este ciclo para evitar
 * fallos de compilación node-gyp en Windows sin build tools (mismo criterio que `bcryptjs` sobre
 * `bcrypt` nativo en auth-usuarios). Es reemplazable sin tocar el dominio — solo el binding del módulo.
 */
@Injectable()
export class PassthroughOptimizadorAdapter implements OptimizadorImagenesPort {
  private readonly logger = new Logger(PassthroughOptimizadorAdapter.name);

  async optimizar(input: { datos: Buffer; formato: FormatoImagen }): Promise<ObjetoVariante[]> {
    this.logger.debug(
      `[optimizador:passthrough] formato=${input.formato} bytes=${input.datos.length} — sin redimensionar (MVP, ver ADR-008/RN-006).`,
    );
    const contentType = CONTENT_TYPE_POR_FORMATO[input.formato];
    return VARIANTES_IMAGEN.map((variante) => ({
      variante,
      datos: input.datos,
      contentType,
    }));
  }
}
