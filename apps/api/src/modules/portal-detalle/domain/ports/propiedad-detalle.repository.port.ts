import type { PropiedadDetalle } from "../read-models/propiedad-detalle.read-model";

export const PROPIEDAD_DETALLE_REPOSITORY = Symbol("PropiedadDetalleRepositoryPort");

/**
 * Puerto de consulta de solo lectura de la ficha de detalle pública. Encapsula el acceso al
 * aggregate `Propiedad` (dueño: `admin-propiedades`) tras la frontera del dominio de
 * `portal-detalle`.
 *
 * DESVIACIÓN documentada (CORE-006): `admin-propiedades` aún no publica un query-port propio para
 * lectura pública, así que el adaptador Prisma lee la tabla `propiedades` directamente, acotado a
 * una proyección de solo lectura y aplicando SIEMPRE la visibilidad pública (RN-025). Mismo
 * precedente que `PropiedadCatalogoPrismaRepository` (portal-catalogo) y `PropiedadAccesoPrismaAdapter`
 * (admin-multimedia). Cuando `admin-propiedades` exponga su `PropiedadQueryPort` público, este
 * adaptador debe delegar en él. Ver CLAUDE.md.
 */
export interface PropiedadDetalleRepositoryPort {
  /**
   * Devuelve la ficha de la propiedad visible con ese `slug` (RN-007), o `null` si no existe o no
   * es pública (RN-025). La visibilidad (estados visibles + no archivada) la impone SIEMPRE el
   * adaptador — no es un parámetro del cliente.
   */
  obtenerPorSlug(slug: string): Promise<PropiedadDetalle | null>;
}
