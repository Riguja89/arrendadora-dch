import type { EstadoPropiedad } from "../types/estado-propiedad";

export const HISTORIAL_ESTADO_REPOSITORY = Symbol("HistorialEstadoRepositoryPort");

/**
 * Vista de lectura de una entrada del historial, enriquecida con el nombre del usuario que
 * realizó el cambio (contrato `HistorialEstado`, DESIGN-028). El nombre se resuelve en el
 * adaptador de persistencia vía la relación con `usuarios`.
 */
export interface HistorialEstadoLectura {
  id: string;
  estadoAnterior: EstadoPropiedad;
  estadoNuevo: EstadoPropiedad;
  usuarioId: string;
  usuarioNombre: string;
  nota: string | null;
  cambiadoEn: Date;
}

/** Puerto de lectura del historial de estados (ADR-006, GAP-007). */
export interface HistorialEstadoRepositoryPort {
  /** Historial cronológico descendente de una propiedad. */
  listarPorPropiedad(propiedadId: string): Promise<HistorialEstadoLectura[]>;
}
