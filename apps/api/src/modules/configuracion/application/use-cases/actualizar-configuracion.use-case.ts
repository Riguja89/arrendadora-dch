import { Inject, Injectable } from "@nestjs/common";
import { ConfiguracionSistema } from "../../domain/entities/configuracion-sistema.entity";
import {
  CONFIGURACION_REPOSITORY,
  type ConfiguracionRepositoryPort,
} from "../../domain/ports/configuracion.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";
import { CONFIGURACION_SINGLETON_ID } from "../../domain/rules/configuracion-constantes";

export interface ActualizarConfiguracionInput {
  actorId: string;
  whatsappNumeroCentral: string;
  whatsappPlantillaMensaje: string;
  nombreInmobiliaria: string;
  imagenGenericaUrl: string;
}

/**
 * CU — Actualizar configuración del sistema (`PUT /admin/configuracion`, ADR-016). Valida los
 * campos editables (invariantes del aggregate), registra `actualizadaPor`/`updatedAt` y persiste.
 * Get-or-create sobre el mismo id fijo: si aún no había fila, parte de la semilla antes de aplicar
 * los cambios, garantizando el singleton.
 */
@Injectable()
export class ActualizarConfiguracionUseCase {
  constructor(
    @Inject(CONFIGURACION_REPOSITORY) private readonly configuraciones: ConfiguracionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: ActualizarConfiguracionInput): Promise<ConfiguracionSistema> {
    const ahora = this.reloj.ahora();
    const configuracion =
      (await this.configuraciones.obtener()) ??
      ConfiguracionSistema.crearPorDefecto({ id: CONFIGURACION_SINGLETON_ID, ahora });

    configuracion.actualizar(
      {
        whatsappNumeroCentral: input.whatsappNumeroCentral,
        whatsappPlantillaMensaje: input.whatsappPlantillaMensaje,
        nombreInmobiliaria: input.nombreInmobiliaria,
        imagenGenericaUrl: input.imagenGenericaUrl,
        actualizadaPor: input.actorId,
      },
      ahora,
    );

    await this.configuraciones.guardar(configuracion);
    return configuracion;
  }
}
