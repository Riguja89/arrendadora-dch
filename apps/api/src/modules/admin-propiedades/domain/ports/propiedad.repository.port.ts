import type { Propiedad } from "../entities/propiedad.entity";
import type { HistorialEstado } from "../entities/historial-estado.entity";
import type { EstadoPropiedad } from "../types/estado-propiedad";
import type { TipoOperacion } from "../types/tipo-operacion";

export const PROPIEDAD_REPOSITORY = Symbol("PropiedadRepositoryPort");

/** Filtros del listado interno (CU-005, HU-004). `agenteId` filtra por agente responsable. */
export interface ListarPropiedadesFiltro {
  estado?: EstadoPropiedad;
  tipoOperacion?: TipoOperacion;
  tipoPropiedadId?: string;
  agenteId?: string;
  archivada?: boolean;
  /** Búsqueda por texto libre en título, código y dirección (spec-003 HU-004). */
  q?: string;
  skip: number;
  take: number;
}

export interface ListarPropiedadesResultado {
  items: Propiedad[];
  total: number;
}

/** Puerto de persistencia del aggregate Propiedad. Implementado por el adaptador Prisma. */
export interface PropiedadRepositoryPort {
  /** Inserta o actualiza la propiedad y sincroniza sus amenidades (N:M). */
  guardar(propiedad: Propiedad): Promise<void>;
  buscarPorId(id: string): Promise<Propiedad | null>;
  listar(filtro: ListarPropiedadesFiltro): Promise<ListarPropiedadesResultado>;
  /**
   * Persiste el cambio de estado de la propiedad e inserta la fila de historial en la MISMA
   * transacción (ADR-006, DEI-001). No toca las amenidades.
   */
  cambiarEstado(propiedad: Propiedad, historial: HistorialEstado): Promise<void>;
}
