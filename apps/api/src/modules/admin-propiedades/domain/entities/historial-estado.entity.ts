import type { EstadoPropiedad } from "../types/estado-propiedad";

/**
 * Entrada del historial de cambios de estado de una propiedad (ADR-006, GAP-007). Registro
 * append-only e inmutable: se inserta una fila por cada transición válida (RN-012), en la misma
 * transacción que actualiza `propiedad.estado` (DEI-001). Es solo informativo (no auditoría formal).
 */
export interface HistorialEstadoProps {
  id: string;
  propiedadId: string;
  estadoAnterior: EstadoPropiedad;
  estadoNuevo: EstadoPropiedad;
  usuarioId: string;
  nota: string | null;
  cambiadoEn: Date;
}

export class HistorialEstado {
  private constructor(private readonly props: HistorialEstadoProps) {}

  static reconstituir(props: HistorialEstadoProps): HistorialEstado {
    return new HistorialEstado({ ...props });
  }

  /** Crea una entrada para una transición recién aplicada. */
  static registrar(input: {
    id: string;
    propiedadId: string;
    estadoAnterior: EstadoPropiedad;
    estadoNuevo: EstadoPropiedad;
    usuarioId: string;
    nota: string | null;
    ahora: Date;
  }): HistorialEstado {
    return new HistorialEstado({
      id: input.id,
      propiedadId: input.propiedadId,
      estadoAnterior: input.estadoAnterior,
      estadoNuevo: input.estadoNuevo,
      usuarioId: input.usuarioId,
      nota: input.nota,
      cambiadoEn: input.ahora,
    });
  }

  toProps(): Readonly<HistorialEstadoProps> {
    return { ...this.props };
  }
}
