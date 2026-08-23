import type { Actor } from "../types/rol-actor";

/**
 * Alcance de un actor sobre una propiedad concreta (RN-010, RN-011, ADR-014):
 *
 * - **Administrador** y **Editor** operan sobre cualquier propiedad.
 * - **Agente** solo sobre las propiedades donde él es el agente responsable.
 *
 * Se usa para las operaciones de escritura/detalle de una propiedad puntual (editar, ver
 * detalle, cambiar estado, duplicar, historial). El listado interno NO aplica esta regla: por
 * RN-010 (excepción) muestra todas las propiedades a cualquier rol.
 */
export function puedeOperarSobrePropiedad(actor: Actor, agenteIdPropiedad: string | null): boolean {
  if (actor.rol === "administrador" || actor.rol === "editor") {
    return true;
  }
  // Agente: solo las propias.
  return agenteIdPropiedad !== null && agenteIdPropiedad === actor.id;
}
