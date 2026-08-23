import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import { GENERADOR_CODIGO, type GeneradorCodigoPort } from "../../domain/ports/generador-codigo.port";
import { ID_GENERATOR, type IdGeneratorPort } from "../../domain/ports/id-generator.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/**
 * HU-003 (RN-026) — Duplicar una propiedad como plantilla: copia campos de texto, precio, tipo y
 * amenidades (sin fotos), en estado `disponible` con nuevo código y slug. Si quien duplica es un
 * Agente, la copia queda a su nombre; Administrador/Editor conservan el agente del original.
 */
@Injectable()
export class DuplicarPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(GENERADOR_CODIGO) private readonly generadorCodigo: GeneradorCodigoPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<Propiedad> {
    const original = await this.propiedades.buscarPorId(input.id);
    if (!original) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, original.agenteId)) {
      throw new SinPermisoPropiedadError();
    }

    const agenteId = input.actor.rol === "agente" ? input.actor.id : original.agenteId;

    const copia = original.duplicar({
      nuevoId: this.idGenerator.nuevo(),
      nuevoCodigo: await this.generadorCodigo.siguiente(),
      agenteId,
      ahora: this.reloj.ahora(),
    });

    await this.propiedades.guardar(copia);
    return copia;
  }
}
