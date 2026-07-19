import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import {
  MULTIMEDIA_QUERY,
  type FotoPublica,
  type MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";

/** Ficha de la propiedad: el aggregate + sus fotos ya resueltas (para poblar `fotos[]` del wire). */
export interface FichaPropiedad {
  propiedad: Propiedad;
  fotos: FotoPublica[];
}

/**
 * GET /admin/propiedades/{id} — detalle. Agente solo las propias (RN-010). Cierra el `fotos[]` del
 * contrato (DESIGN-028) consumiendo el `MultimediaQueryPort` que exporta `admin-multimedia`,
 * in-process (DESIGN-027), sin acoplarse al aggregate `GaleriaFotos`. Las fotos vienen ordenadas
 * con la portada primero (RN-014).
 */
@Injectable()
export class ObtenerPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(MULTIMEDIA_QUERY) private readonly multimedia: MultimediaQueryPort,
  ) {}

  async ejecutar(input: { actor: Actor; id: string }): Promise<FichaPropiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }
    const fotos = await this.multimedia.listarFotosDePropiedad(propiedad.id);
    return { propiedad, fotos };
  }
}
