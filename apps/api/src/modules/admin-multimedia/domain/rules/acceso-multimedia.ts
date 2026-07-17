import type { Actor } from "../types/rol-actor";

/**
 * Alcance de un actor sobre la multimedia de una propiedad (RN-010/RN-011 heredadas de
 * admin-propiedades, ADR-014). La multimedia es composición de la Propiedad, así que su gestión
 * sigue el mismo alcance por rol que la edición de la propiedad:
 *
 * - **Administrador** y **Editor** gestionan la galería de cualquier propiedad.
 * - **Agente** solo la de las propiedades donde él es el agente responsable.
 */
export function puedeGestionarMultimedia(actor: Actor, agenteIdPropiedad: string | null): boolean {
  if (actor.rol === "administrador" || actor.rol === "editor") {
    return true;
  }
  return agenteIdPropiedad !== null && agenteIdPropiedad === actor.id;
}
