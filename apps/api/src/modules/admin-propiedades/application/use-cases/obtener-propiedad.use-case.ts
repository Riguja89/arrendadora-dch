import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";

/** GET /admin/propiedades/{id} — detalle. Agente solo las propias (RN-010). */
@Injectable()
export class ObtenerPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }
    return propiedad;
  }
}
