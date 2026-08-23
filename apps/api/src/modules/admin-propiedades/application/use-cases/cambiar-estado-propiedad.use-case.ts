import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import { HistorialEstado } from "../../domain/entities/historial-estado.entity";
import type { Actor } from "../../domain/types/rol-actor";
import type { EstadoPropiedad } from "../../domain/types/estado-propiedad";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import { ID_GENERATOR, type IdGeneratorPort } from "../../domain/ports/id-generator.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface CambiarEstadoPropiedadInput {
  actor: Actor;
  id: string;
  estadoNuevo: EstadoPropiedad;
  nota: string | null;
}

/**
 * CU-003 (HU-002) — Cambiar el estado de una propiedad aplicando la máquina de estados (RN-012).
 * La transición y la exclusividad del Administrador para reabrir se validan en el aggregate. Cada
 * transición válida registra una fila de historial (ADR-006) en la misma transacción (DEI-001).
 */
@Injectable()
export class CambiarEstadoPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: CambiarEstadoPropiedadInput): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }

    const ahora = this.reloj.ahora();
    const estadoAnterior = propiedad.cambiarEstado(input.estadoNuevo, input.actor.rol, ahora);

    const historial = HistorialEstado.registrar({
      id: this.idGenerator.nuevo(),
      propiedadId: propiedad.id,
      estadoAnterior,
      estadoNuevo: input.estadoNuevo,
      usuarioId: input.actor.id,
      nota: input.nota,
      ahora,
    });

    await this.propiedades.cambiarEstado(propiedad, historial);
    return propiedad;
  }
}
