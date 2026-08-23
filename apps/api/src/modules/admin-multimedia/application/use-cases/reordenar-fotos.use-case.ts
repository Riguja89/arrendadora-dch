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
 * CU-002 (HU-002) / RN-031 — reordena la galería según el orden de IDs recibido. El mismo orden se
 * refleja en el portal. Agente solo sobre sus propiedades (RN-010).
 */
@Injectable()
export class ReordenarFotosUseCase {
  constructor(
    @Inject(PROPIEDAD_ACCESO) private readonly propiedades: PropiedadAccesoPort,
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; propiedadId: string; ordenIds: string[] }): Promise<Foto[]> {
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
    galeria.reordenar(input.ordenIds, this.reloj.ahora());
    await this.fotos.sincronizar({
      propiedadId: input.propiedadId,
      fotos: [...galeria.fotos()],
      idsEliminadas: [],
    });
    return [...galeria.fotos()];
  }
}
