import type { Foto } from "../entities/foto.entity";

export const FOTO_REPOSITORY = Symbol("FotoRepositoryPort");

/** Puerto de persistencia de la galería de fotos. Implementado por el adaptador Prisma. */
export interface FotoRepositoryPort {
  /** Fotos de una propiedad ordenadas por `orden` ascendente. Lista vacía si no tiene ninguna. */
  listarPorPropiedad(propiedadId: string): Promise<Foto[]>;

  /**
   * Sincroniza la galería en UNA transacción (DEI-001): hace upsert de `fotos` (nuevas + posiciones
   * actualizadas) y elimina las filas de `idsEliminadas`. Cubre carga, reorden, portada y borrado.
   */
  sincronizar(input: { propiedadId: string; fotos: Foto[]; idsEliminadas: string[] }): Promise<void>;
}
