import type { RolUsuario } from "@arrendadora/shared";
import type { EstadoPropiedad } from "./propiedades-types";

/**
 * Máquina de estados de la propiedad — RN-012 (spec-003), ADR-006, DESIGN-028
 * (`PATCH /admin/propiedades/{id}/estado`).
 *
 * Transiciones válidas:
 * - `disponible ↔ reservada`
 * - `disponible → arrendada_vendida`
 * - `reservada → arrendada_vendida`
 * - `arrendada_vendida → disponible` — **solo Administrador** (ADR-014, restauración excepcional)
 *
 * Lógica pura — la autoridad real vive en el backend (ADR-014); esto solo controla qué
 * transiciones ofrece la UI para no mostrar botones que el servidor rechazaría con 409.
 */

export const ETIQUETAS_ESTADO: Record<EstadoPropiedad, string> = {
  disponible: "Disponible",
  reservada: "Reservada",
  arrendada_vendida: "Arrendada / Vendida",
};

const TRANSICIONES_BASE: Record<EstadoPropiedad, EstadoPropiedad[]> = {
  disponible: ["reservada", "arrendada_vendida"],
  reservada: ["disponible", "arrendada_vendida"],
  arrendada_vendida: ["disponible"],
};

/** Estados a los que se puede transicionar desde `estadoActual`, filtrados por el rol de sesión. */
export function transicionesPermitidas(estadoActual: EstadoPropiedad, rol: RolUsuario | null): EstadoPropiedad[] {
  const candidatos = TRANSICIONES_BASE[estadoActual] ?? [];

  // Reapertura arrendada_vendida → disponible: exclusiva del Administrador (RN-012, ADR-014).
  if (estadoActual === "arrendada_vendida") {
    return rol === "administrador" ? candidatos : [];
  }

  return candidatos;
}

/**
 * `true` si la transición requiere confirmación explícita del usuario antes de aplicarse
 * (spec-003 CU-003 flujo principal 4, escenario 3 de HU-002; y restauración excepcional RN-012).
 */
export function requiereConfirmacion(estadoActual: EstadoPropiedad, estadoNuevo: EstadoPropiedad): boolean {
  if (estadoNuevo === "arrendada_vendida") return true;
  if (estadoActual === "arrendada_vendida" && estadoNuevo === "disponible") return true;
  return false;
}

/** Mensaje de confirmación a mostrar para la transición — texto literal de spec-003 cuando aplica. */
export function mensajeConfirmacion(estadoActual: EstadoPropiedad, estadoNuevo: EstadoPropiedad): string {
  if (estadoNuevo === "arrendada_vendida") {
    return "Esta acción marcará la propiedad como entregada. ¿Deseás confirmar?";
  }
  if (estadoActual === "arrendada_vendida" && estadoNuevo === "disponible") {
    return "Esta es una restauración excepcional: la propiedad volverá a estar disponible en el portal. ¿Deseás confirmar?";
  }
  return "¿Deseás confirmar el cambio de estado?";
}
