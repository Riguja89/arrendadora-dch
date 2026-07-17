import { Inject, Injectable } from "@nestjs/common";
import type { Actor } from "../../domain/types/rol-actor";
import type { Foto } from "../../domain/entities/foto.entity";
import { GaleriaFotos } from "../../domain/entities/galeria-fotos.entity";
import { puedeGestionarMultimedia } from "../../domain/rules/acceso-multimedia";
import {
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import { FOTO_REPOSITORY, type FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import { PROPIEDAD_ACCESO, type PropiedadAccesoPort } from "../../domain/ports/propiedad-acceso.port";

/**
 * Lista la galería de fotos de una propiedad para el panel (ordenada, portada primero). El alcance
 * por rol es el mismo que el de la propiedad (RN-010): el Agente solo las suyas.
 */
@Injectable()
export class ListarFotosUseCase {
  constructor(
    @Inject(PROPIEDAD_ACCESO) private readonly propiedades: PropiedadAccesoPort,
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
  ) {}

  async ejecutar(input: { actor: Actor; propiedadId: string }): Promise<Foto[]> {
    const acceso = await this.propiedades.obtener(input.propiedadId);
    if (!acceso) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeGestionarMultimedia(input.actor, acceso.agenteId)) {
      throw new SinPermisoMultimediaError();
    }
    const galeria = GaleriaFotos.reconstituir(
      input.propiedadId,
      await this.fotos.listarPorPropiedad(input.propiedadId),
    );
    return [...galeria.fotos()];
  }
}
