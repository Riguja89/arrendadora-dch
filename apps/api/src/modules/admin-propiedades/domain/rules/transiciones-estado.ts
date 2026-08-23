import type { EstadoPropiedad } from "../types/estado-propiedad";

/**
 * Máquina de estados de la propiedad (RN-012, ERD DESIGN-026). Transiciones permitidas:
 *
 * - `disponible → reservada`   (cualquier Agente/Administrador/Editor)
 * - `reservada → disponible`   (reversión si no se concretó)
 * - `disponible → arrendada_vendida`
 * - `reservada → arrendada_vendida`
 * - `arrendada_vendida → disponible`  (reapertura excepcional — SOLO Administrador)
 *
 * El estado `arrendada_vendida` es terminal para Agente/Editor; solo el Administrador puede
 * reabrirlo. Cualquier transición no listada (incluida `estado → mismo estado`) es inválida.
 */
const TRANSICIONES: Readonly<Record<EstadoPropiedad, readonly EstadoPropiedad[]>> = {
  disponible: ["reservada", "arrendada_vendida"],
  reservada: ["disponible", "arrendada_vendida"],
  arrendada_vendida: ["disponible"],
};

/** Transiciones que solo el Administrador puede ejecutar (RN-012, ADR-014). */
export function requiereAdministrador(
  desde: EstadoPropiedad,
  hacia: EstadoPropiedad,
): boolean {
  return desde === "arrendada_vendida" && hacia === "disponible";
}

/** `true` si `desde → hacia` es una transición válida de la máquina de estados (sin considerar rol). */
export function esTransicionValida(desde: EstadoPropiedad, hacia: EstadoPropiedad): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/** Estados alcanzables desde `desde` (útil para que la UI deshabilite las opciones inválidas). */
export function transicionesDisponibles(desde: EstadoPropiedad): readonly EstadoPropiedad[] {
  return TRANSICIONES[desde];
}
