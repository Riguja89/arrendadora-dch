import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { PropiedadNoEncontradaError } from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/**
 * RN-027 — Restaurar una propiedad archivada (vuelve a ser visible según su estado). Es una acción
 * excepcional reservada al **Administrador** (RN-027), enforced en el controller (RBAC, ADR-014).
 */
@Injectable()
export class RestaurarPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    propiedad.restaurar(this.reloj.ahora());
    await this.propiedades.guardar(propiedad);
    return propiedad;
  }
}
