import { Inject, Injectable } from "@nestjs/common";
import { ConfiguracionSistema } from "../../domain/entities/configuracion-sistema.entity";
import {
  CONFIGURACION_REPOSITORY,
  type ConfiguracionRepositoryPort,
} from "../../domain/ports/configuracion.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";
import { CONFIGURACION_SINGLETON_ID } from "../../domain/rules/configuracion-constantes";

/**
 * CU — Obtener configuración del sistema (`GET /admin/configuracion`, ADR-016). Patrón
 * get-or-create: si la fila singleton aún no existe, la siembra con los valores por defecto y la
 * persiste, de modo que la lectura nunca falle. El id fijo garantiza que solo puede existir una fila.
 */
@Injectable()
export class ObtenerConfiguracionUseCase {
  constructor(
    @Inject(CONFIGURACION_REPOSITORY) private readonly configuraciones: ConfiguracionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(): Promise<ConfiguracionSistema> {
    const existente = await this.configuraciones.obtener();
    if (existente) {
      return existente;
    }
    const semilla = ConfiguracionSistema.crearPorDefecto({
      id: CONFIGURACION_SINGLETON_ID,
      ahora: this.reloj.ahora(),
    });
    await this.configuraciones.guardar(semilla);
    return semilla;
  }
}
