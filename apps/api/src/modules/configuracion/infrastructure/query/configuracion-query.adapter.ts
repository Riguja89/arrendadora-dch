import { Injectable } from "@nestjs/common";
import { ObtenerConfiguracionUseCase } from "../../application/use-cases/obtener-configuracion.use-case";
import type {
  ConfiguracionPublica,
  ConfiguracionQueryPort,
} from "../../domain/ports/configuracion-query.port";

/**
 * Implementa `ConfiguracionQueryPort` reutilizando `ObtenerConfiguracionUseCase` (única fuente del
 * get-or-create) y proyectando la configuración a su shape público — sin campos de auditoría. Es lo
 * que el módulo `configuracion` exporta a los consumidores downstream (Portal Detalle/Contacto,
 * ADR-016) para armar el deep link de WhatsApp sin pasar por HTTP ni por el endpoint admin.
 */
@Injectable()
export class ConfiguracionQueryAdapter implements ConfiguracionQueryPort {
  constructor(private readonly obtenerConfiguracion: ObtenerConfiguracionUseCase) {}

  async obtenerConfiguracionPublica(): Promise<ConfiguracionPublica> {
    const configuracion = await this.obtenerConfiguracion.ejecutar();
    return {
      whatsappNumeroCentral: configuracion.whatsappNumeroCentral,
      whatsappPlantillaMensaje: configuracion.whatsappPlantillaMensaje,
      nombreInmobiliaria: configuracion.nombreInmobiliaria,
      imagenGenericaUrl: configuracion.imagenGenericaUrl,
    };
  }
}
