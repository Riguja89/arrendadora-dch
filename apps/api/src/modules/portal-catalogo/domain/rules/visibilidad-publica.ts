import type { EstadoVisiblePublico } from "../types/estado-visible-publico";

/**
 * Reglas de visibilidad del catálogo público (RN-005, RN-013, RN-023). Se declaran en el dominio
 * (no en la persistencia) para que el criterio de "qué es público" sea explícito y auditable; el
 * adaptador Prisma solo las aplica en su cláusula `where`.
 */

/**
 * Estados que un visitante puede ver en el portal. `arrendada_vendida` queda fuera por definición
 * (RN-005); las archivadas también se excluyen, con un filtro aparte sobre `archivada` (RN-005
 * excepción).
 */
export const ESTADOS_VISIBLES_PUBLICO: readonly EstadoVisiblePublico[] = ["disponible", "reservada"];

/** Máximo de propiedades destacadas en la página de inicio (RN-023). */
export const DESTACADAS_MAXIMO = 6;

/**
 * Un badge "Reservada" se muestra en la tarjeta cuando el estado es `reservada` (RN-013).
 * Función pura reutilizada por el mapper del wire.
 */
export function esBadgeReservada(estado: EstadoVisiblePublico): boolean {
  return estado === "reservada";
}
