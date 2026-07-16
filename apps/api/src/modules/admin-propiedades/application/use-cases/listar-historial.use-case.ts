import { Inject, Injectable } from "@nestjs/common";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import {
  HISTORIAL_ESTADO_REPOSITORY,
  type HistorialEstadoLectura,
  type HistorialEstadoRepositoryPort,
} from "../../domain/ports/historial-estado.repository.port";

/**
 * GET /admin/propiedades/{id}/historial — historial cronológico de cambios de estado (ADR-006,
 * GAP-007). Agente solo el de sus propias propiedades (RN-010). Verifica primero que la propiedad
 * exista y que el actor tenga alcance sobre ella.
 */
@Injectable()
export class ListarHistorialUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(HISTORIAL_ESTADO_REPOSITORY) private readonly historial: HistorialEstadoRepositoryPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<HistorialEstadoLectura[]> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }
    return this.historial.listarPorPropiedad(input.id);
  }
}
