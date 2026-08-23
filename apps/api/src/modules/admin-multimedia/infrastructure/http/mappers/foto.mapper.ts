import type { Foto } from "../../../domain/entities/foto.entity";
import type { AlmacenamientoObjetosPort } from "../../../domain/ports/almacenamiento-objetos.port";

/**
 * Shape del wire (snake_case) del schema `Foto` del contrato admin (DESIGN-028, ADR-015). Se declara
 * local al módulo (mismo criterio que `PaginacionMetaWire` en auth-usuarios) para no acoplar
 * `@arrendadora/shared` a este contrato. Las URLs de variante las resuelve el almacenamiento.
 */
export interface FotoWire {
  id: string;
  propiedad_id: string;
  orden: number;
  es_portada: boolean;
  formato_original: string;
  url_optimizada: string;
  url_card: string;
  url_thumbnail: string;
  created_at: string;
}

/** Mapea una `Foto` del dominio al shape exacto del contrato `Foto` (DESIGN-028). */
export function aFotoWire(foto: Foto, almacenamiento: AlmacenamientoObjetosPort): FotoWire {
  return {
    id: foto.id,
    propiedad_id: foto.propiedadId,
    orden: foto.orden,
    es_portada: foto.esPortada,
    formato_original: foto.formatoOriginal,
    url_optimizada: almacenamiento.urlDe(foto.s3KeyBase, "original"),
    url_card: almacenamiento.urlDe(foto.s3KeyBase, "card"),
    url_thumbnail: almacenamiento.urlDe(foto.s3KeyBase, "thumbnail"),
    created_at: foto.createdAt.toISOString(),
  };
}
