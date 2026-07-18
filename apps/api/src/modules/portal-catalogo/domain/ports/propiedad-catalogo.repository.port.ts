import type { PropiedadCatalogo } from "../read-models/propiedad-catalogo.read-model";
import type { TipoPropiedadPublico } from "../read-models/tipo-propiedad-publico.read-model";
import type { CiudadConteo } from "../read-models/ciudad-conteo.read-model";
import type { TipoOperacion } from "../types/tipo-operacion";

export const PROPIEDAD_CATALOGO_REPOSITORY = Symbol("PropiedadCatalogoRepositoryPort");

/**
 * Filtros acumulativos de la búsqueda pública (RN-024, contrato DESIGN-029 `/public/propiedades`).
 * Todos son opcionales; ausentes = no acotan. La visibilidad pública (estados visibles + no
 * archivada, RN-005) la impone SIEMPRE el adaptador — no es un filtro del cliente.
 */
export interface FiltroBusquedaCatalogo {
  tipoOperacion?: TipoOperacion;
  /** Slug o id del tipo de propiedad (contrato). Como el modelo no tiene slug, el adaptador resuelve por id (UUID) o por nombre. */
  tipoPropiedad?: string;
  ciudad?: string;
  barrio?: string;
  /** Búsqueda por texto libre sobre título, barrio y ciudad (contrato). */
  q?: string;
  /** Precio mínimo en COP entero (inclusive). */
  precioMin?: number;
  /** Precio máximo en COP entero (inclusive). */
  precioMax?: number;
  skip: number;
  take: number;
}

export interface ResultadoBusquedaCatalogo {
  items: PropiedadCatalogo[];
  total: number;
}

/**
 * Puerto de consulta de solo lectura del catálogo público. Encapsula el acceso al aggregate
 * `Propiedad` (dueño: `admin-propiedades`) tras la frontera del dominio de `portal-catalogo`.
 *
 * DESVIACIÓN documentada (CORE-006): `admin-propiedades` aún no publica un query-port propio para
 * lectura pública, así que el adaptador Prisma lee la tabla `propiedades` directamente, acotado a
 * una proyección de solo lectura y aplicando la visibilidad pública (RN-005). Mismo precedente que
 * `PropiedadAccesoPrismaAdapter` de `admin-multimedia`. Cuando `admin-propiedades` exponga su
 * `PropiedadQueryPort` público, este adaptador debe delegar en él. Ver CLAUDE.md.
 */
export interface PropiedadCatalogoRepositoryPort {
  /** Búsqueda paginada con filtros acumulativos, ordenada por publicación descendente (RN-024). */
  buscar(filtro: FiltroBusquedaCatalogo): Promise<ResultadoBusquedaCatalogo>;

  /** Hasta `limite` propiedades destacadas visibles, ordenadas por recencia de publicación (RN-023). */
  listarDestacadas(limite: number): Promise<PropiedadCatalogo[]>;

  /**
   * Hasta `limite` propiedades recientes en estado `disponible` (fallback de destacadas, RN-023),
   * excluyendo los ids ya incluidos para no duplicar tarjetas.
   */
  listarRecientesDisponibles(limite: number, excluirIds: string[]): Promise<PropiedadCatalogo[]>;

  /** Tipos de propiedad activos para el filtro (ADR-005). */
  listarTiposPropiedadActivos(): Promise<TipoPropiedadPublico[]>;

  /** Ciudades con al menos una propiedad visible y su conteo (GAP-002). */
  listarCiudadesConVisibles(): Promise<CiudadConteo[]>;
}
