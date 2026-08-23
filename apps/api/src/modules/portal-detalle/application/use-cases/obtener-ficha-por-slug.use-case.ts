import { Inject, Injectable } from "@nestjs/common";
import {
  MULTIMEDIA_QUERY,
  type FotoPublica,
  type MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";
import {
  CONFIGURACION_QUERY,
  type ConfiguracionQueryPort,
} from "../../../configuracion/domain/ports/configuracion-query.port";
import {
  PROPIEDAD_DETALLE_REPOSITORY,
  type PropiedadDetalleRepositoryPort,
} from "../../domain/ports/propiedad-detalle.repository.port";
import type { PropiedadDetalle } from "../../domain/read-models/propiedad-detalle.read-model";
import { PropiedadNoEncontradaError } from "../../domain/errors/dominio-detalle.errors";

/** Parámetros de la ficha: el slug de la URL y la base pública del portal (para el `og:url`). */
export interface ParametrosFicha {
  slug: string;
  /** Base del SPA del portal público (ADR-010); se usa para el `open_graph.url` canónico. */
  portalBaseUrl: string;
}

/**
 * Ficha completa que consume el mapper del wire: el read model de la propiedad + la galería
 * (composición de `admin-multimedia`) + los insumos de Open Graph resueltos (RN-008, ADR-010).
 */
export interface FichaDetalle {
  propiedad: PropiedadDetalle;
  /** Fotos ordenadas (portada primero); vacío si la propiedad aún no tiene fotos. */
  galeria: FotoPublica[];
  /** Imagen para `og:image`: portada (tamaño optimizado) o imagen genérica de fallback (RN-008). */
  imagenOpenGraph: string;
  /** URL pública canónica de la ficha para `og:url` (ADR-010). */
  urlPublica: string;
}

/**
 * CU-001 (HU-001, HU-002) — Ver la ficha completa de una propiedad por su `slug` (RN-007). Compone
 * tres bounded contexts de solo lectura, in-process (DESIGN-027):
 *
 * - `portal-detalle` (repo): datos de la propiedad, aplicando SIEMPRE la visibilidad pública
 *   (RN-025). Si no existe o no es pública → `PropiedadNoEncontradaError` (404).
 * - `admin-multimedia` (MULTIMEDIA_QUERY): galería de fotos ordenada (RN-014, RN-031).
 * - `configuracion` (CONFIGURACION_QUERY): imagen genérica de fallback para el `og:image` cuando la
 *   propiedad no tiene fotos (RN-008).
 *
 * La privacidad de la dirección (ADR-011) la garantiza el read model, que expone solo coordenadas
 * aproximadas y nunca la `direccion` cruda.
 */
@Injectable()
export class ObtenerFichaPorSlugUseCase {
  constructor(
    @Inject(PROPIEDAD_DETALLE_REPOSITORY)
    private readonly propiedades: PropiedadDetalleRepositoryPort,
    @Inject(MULTIMEDIA_QUERY) private readonly multimedia: MultimediaQueryPort,
    @Inject(CONFIGURACION_QUERY) private readonly configuracion: ConfiguracionQueryPort,
  ) {}

  async ejecutar(parametros: ParametrosFicha): Promise<FichaDetalle> {
    const propiedad = await this.propiedades.obtenerPorSlug(parametros.slug);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }

    const [galeria, config] = await Promise.all([
      this.multimedia.listarFotosDePropiedad(propiedad.id),
      this.configuracion.obtenerConfiguracionPublica(),
    ]);

    const portada = galeria.find((foto) => foto.esPortada) ?? galeria[0];
    const imagenOpenGraph = portada ? portada.urlOptimizada : config.imagenGenericaUrl;
    const urlPublica = `${parametros.portalBaseUrl.replace(/\/+$/, "")}/propiedades/${propiedad.slug}`;

    return { propiedad, galeria, imagenOpenGraph, urlPublica };
  }
}
