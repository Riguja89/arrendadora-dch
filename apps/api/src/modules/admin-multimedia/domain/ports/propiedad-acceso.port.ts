export const PROPIEDAD_ACCESO = Symbol("PropiedadAccesoPort");

/** Proyección mínima de una propiedad necesaria para gestionar su multimedia. */
export interface PropiedadAcceso {
  /** Agente responsable (RN-010, alcance del rol Agente); `null` si no tiene agente asignado. */
  agenteId: string | null;
  /** `true` si el estado de la propiedad la hace visible en el portal (ADR-008, regla de última foto). */
  esVisible: boolean;
}

/**
 * Puerto de lectura hacia el aggregate `Propiedad` (dueño: admin-propiedades). La multimedia es
 * composición de la propiedad (DESIGN-027): necesita saber si existe, quién es su agente (alcance
 * RBAC) y si está visible (regla de "no dejar visible sin fotos"). Se accede vía puerto in-process,
 * nunca replicando reglas de negocio de la propiedad. Devuelve `null` si la propiedad no existe.
 */
export interface PropiedadAccesoPort {
  obtener(propiedadId: string): Promise<PropiedadAcceso | null>;
}
