import type { ConfiguracionSistema } from "../entities/configuracion-sistema.entity";

export const CONFIGURACION_REPOSITORY = Symbol("ConfiguracionRepositoryPort");

/**
 * Puerto de persistencia del aggregate singleton `ConfiguracionSistema`. Implementado por el
 * adaptador Prisma. `obtener()` devuelve `null` si la fila aún no fue sembrada — el caso de uso
 * aplica get-or-create.
 */
export interface ConfiguracionRepositoryPort {
  obtener(): Promise<ConfiguracionSistema | null>;
  guardar(configuracion: ConfiguracionSistema): Promise<void>;
}
