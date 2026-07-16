import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/**
 * RN-027 — Archivar una propiedad (borrado lógico): queda invisible en el portal y en el listado
 * activo, pero se conserva. Restringido a Administrador/Editor en el controller (RBAC, ADR-014).
 */
@Injectable()
export class ArchivarPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }
    propiedad.archivar(this.reloj.ahora());
    await this.propiedades.guardar(propiedad);
    return propiedad;
  }
}
