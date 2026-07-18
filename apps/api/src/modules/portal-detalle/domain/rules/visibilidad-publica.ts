import type { EstadoVisiblePublico } from "../types/estado-visible-publico";

/**
 * Reglas de visibilidad de la ficha pública (RN-025). Se declaran en el dominio (no en la
 * persistencia) para que el criterio de "qué propiedad es pública" sea explícito y auditable; el
 * adaptador Prisma solo las aplica en su cláusula `where`.
 */

/**
 * Estados que un visitante puede ver en la ficha de detalle. `arrendada_vendida` queda fuera por
 * definición (RN-025 → 404); las archivadas también se excluyen, con un filtro aparte sobre
 * `archivada`.
 */
export const ESTADOS_VISIBLES_PUBLICO: readonly EstadoVisiblePublico[] = ["disponible", "reservada"];

/**
 * Un banner "Reservada" se muestra en la ficha cuando el estado es `reservada` (RN-025). Función
 * pura reutilizada por el mapper del wire (`badge_reservada`).
 */
export function esBadgeReservada(estado: EstadoVisiblePublico): boolean {
  return estado === "reservada";
}
