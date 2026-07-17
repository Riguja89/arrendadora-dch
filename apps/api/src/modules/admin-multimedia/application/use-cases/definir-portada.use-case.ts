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
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/**
 * RN-014 — marca una foto como portada única de la propiedad (la usa el listado, el detalle y el
 * og:image del portal). Agente solo sobre sus propiedades (RN-010).
 */
@Injectable()
export class DefinirPortadaUseCase {
  constructor(
    @Inject(PROPIEDAD_ACCESO) private readonly propiedades: PropiedadAccesoPort,
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; propiedadId: string; fotoId: string }): Promise<Foto[]> {
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
    galeria.marcarPortada(input.fotoId, this.reloj.ahora());
    await this.fotos.sincronizar({
      propiedadId: input.propiedadId,
      fotos: [...galeria.fotos()],
      idsEliminadas: [],
    });
    return [...galeria.fotos()];
  }
}
