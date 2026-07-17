import { Inject, Injectable } from "@nestjs/common";
import type { Actor } from "../../domain/types/rol-actor";
import { GaleriaFotos } from "../../domain/entities/galeria-fotos.entity";
import { puedeGestionarMultimedia } from "../../domain/rules/acceso-multimedia";
import {
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import { FOTO_REPOSITORY, type FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import {
  ALMACENAMIENTO_OBJETOS,
  type AlmacenamientoObjetosPort,
} from "../../domain/ports/almacenamiento-objetos.port";
import { PROPIEDAD_ACCESO, type PropiedadAccesoPort } from "../../domain/ports/propiedad-acceso.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/**
 * RN-032 — elimina una foto individual sin afectar el resto de la propiedad. Si era la portada, la
 * siguiente en orden pasa a portada. No permite dejar en 0 fotos a una propiedad visible (ADR-008).
 * Purga los binarios de la foto en el almacenamiento tras validar la regla de dominio.
 */
@Injectable()
export class EliminarFotoUseCase {
  constructor(
    @Inject(PROPIEDAD_ACCESO) private readonly propiedades: PropiedadAccesoPort,
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
    @Inject(ALMACENAMIENTO_OBJETOS) private readonly almacenamiento: AlmacenamientoObjetosPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: { actor: Actor; propiedadId: string; fotoId: string }): Promise<void> {
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
    const eliminada = galeria.eliminar(input.fotoId, acceso.esVisible, this.reloj.ahora());
    await this.almacenamiento.eliminarPrefijos([eliminada.s3KeyBase]);
    await this.fotos.sincronizar({
      propiedadId: input.propiedadId,
      fotos: [...galeria.fotos()],
      idsEliminadas: [input.fotoId],
    });
  }
}
