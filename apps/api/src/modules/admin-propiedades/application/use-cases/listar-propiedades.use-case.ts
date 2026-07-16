import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import type { EstadoPropiedad } from "../../domain/types/estado-propiedad";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";

export interface ListarPropiedadesInput {
  actor: Actor;
  estado?: EstadoPropiedad;
  tipoOperacion?: TipoOperacion;
  tipoPropiedadId?: string;
  /** UUID de agente o `"me"` (las del usuario actual). Ausente → todas (RN-010, excepción). */
  agente?: string;
  archivada?: boolean;
  q?: string;
  pagina: number;
  tamanoPagina: number;
}

export interface ListarPropiedadesResultado {
  items: Propiedad[];
  total: number;
}

/**
 * CU-005 (HU-004) — Listado interno paginado con filtros y búsqueda por texto libre. Por RN-010
 * (excepción) el listado muestra **todas** las propiedades a cualquier rol; el control de edición
 * es por propiedad (ver `EditarPropiedadUseCase`). El filtro `agente=me` acota a las propias.
 */
@Injectable()
export class ListarPropiedadesUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
  ) {}

  async ejecutar(input: ListarPropiedadesInput): Promise<ListarPropiedadesResultado> {
    const agenteId = this.resolverAgente(input);
    const skip = (input.pagina - 1) * input.tamanoPagina;

    return this.propiedades.listar({
      estado: input.estado,
      tipoOperacion: input.tipoOperacion,
      tipoPropiedadId: input.tipoPropiedadId,
      agenteId,
      archivada: input.archivada,
      q: input.q,
      skip,
      take: input.tamanoPagina,
    });
  }

  private resolverAgente(input: ListarPropiedadesInput): string | undefined {
    if (!input.agente) {
      return undefined;
    }
    return input.agente === "me" ? input.actor.id : input.agente;
  }
}
