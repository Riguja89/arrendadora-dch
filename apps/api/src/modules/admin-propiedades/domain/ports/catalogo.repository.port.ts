import type { CatalogoItem } from "../entities/catalogo-item.entity";

/** Tokens de inyección — un catálogo administrable por token (ADR-005). */
export const TIPO_PROPIEDAD_REPOSITORY = Symbol("TipoPropiedadRepositoryPort");
export const AMENIDAD_REPOSITORY = Symbol("AmenidadRepositoryPort");

/**
 * Puerto genérico de un catálogo administrable (`tipos_propiedad` o `amenidades`). Ambos comparten
 * contrato; el adaptador concreto decide sobre qué tabla opera. Borrado lógico (ADR-005): `listar`
 * excluye los inactivos salvo que se pida `incluirInactivos`.
 */
export interface CatalogoRepositoryPort {
  listar(incluirInactivos: boolean): Promise<CatalogoItem[]>;
  buscarPorId(id: string): Promise<CatalogoItem | null>;
  /** Búsqueda por nombre normalizado (case-insensitive) para validar unicidad. */
  buscarPorNombre(nombre: string): Promise<CatalogoItem | null>;
  guardar(item: CatalogoItem): Promise<void>;
  /** `true` si todos los ids existen y están activos (validación de referencias en Propiedad). */
  existenActivos(ids: string[]): Promise<boolean>;
}
