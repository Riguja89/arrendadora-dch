import { Inject, Injectable } from "@nestjs/common";
import type { FotoPublica, MultimediaQueryPort } from "../../domain/ports/multimedia-query.port";
import { FOTO_REPOSITORY, type FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import {
  ALMACENAMIENTO_OBJETOS,
  type AlmacenamientoObjetosPort,
} from "../../domain/ports/almacenamiento-objetos.port";

/**
 * Implementa `MultimediaQueryPort` proyectando las fotos de una propiedad a su shape público
 * (URLs de CDN + metadatos, sin claves de almacenamiento). Es lo que el módulo exporta a los
 * consumidores downstream (admin-propiedades cierra su `fotos[]`, el portal arma la galería/og:image)
 * sin acoplarlos al aggregate `GaleriaFotos` (ADR-008, in-process DESIGN-027). Las URLs las resuelve
 * el `AlmacenamientoObjetosPort`, así que cambian con el proveedor sin tocar a los consumidores.
 */
@Injectable()
export class MultimediaQueryAdapter implements MultimediaQueryPort {
  constructor(
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
    @Inject(ALMACENAMIENTO_OBJETOS) private readonly almacenamiento: AlmacenamientoObjetosPort,
  ) {}

  async listarFotosDePropiedad(propiedadId: string): Promise<FotoPublica[]> {
    const fotos = await this.fotos.listarPorPropiedad(propiedadId);
    return fotos
      .sort((a, b) => a.orden - b.orden)
      .map((foto) => ({
        id: foto.id,
        orden: foto.orden,
        esPortada: foto.esPortada,
        formatoOriginal: foto.formatoOriginal,
        urlOptimizada: this.almacenamiento.urlDe(foto.s3KeyBase, "original"),
        urlCard: this.almacenamiento.urlDe(foto.s3KeyBase, "card"),
        urlThumbnail: this.almacenamiento.urlDe(foto.s3KeyBase, "thumbnail"),
        createdAt: foto.createdAt,
      }));
  }
}
