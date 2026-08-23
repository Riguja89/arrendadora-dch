import { Inject, Injectable } from "@nestjs/common";
import {
  MULTIMEDIA_QUERY,
  type MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";
import {
  CONFIGURACION_QUERY,
  type ConfiguracionQueryPort,
} from "../../../configuracion/domain/ports/configuracion-query.port";

/**
 * Resuelve la URL de portada de cada tarjeta del catálogo (RN-014, contrato DESIGN-029
 * `PropiedadResumen.portada_url`) componiendo dos bounded contexts de solo lectura, in-process
 * (DESIGN-027):
 *
 * - `admin-multimedia` (MULTIMEDIA_QUERY): fotos de la propiedad; se toma la portada (o la primera
 *   si ninguna está marcada), usando `urlCard` — el tamaño de las tarjetas del listado.
 * - `configuracion` (CONFIGURACION_QUERY): imagen genérica de fallback cuando la propiedad no tiene
 *   fotos aún (RN-014).
 *
 * ESTRATEGIA N+1 (documentada): `MultimediaQueryPort` solo expone lectura por propiedad, así que se
 * consultan las fotos en paralelo (`Promise.all`) — una consulta por propiedad de la página (máx.
 * 48). La configuración se lee UNA sola vez por request. Si en el futuro el volumen lo exige, la
 * optimización correcta es un método batch en `MultimediaQueryPort` (extensión no invasiva de
 * `admin-multimedia`), NO duplicar aquí la lógica de multimedia.
 */
@Injectable()
export class EnriquecedorPortadasService {
  constructor(
    @Inject(MULTIMEDIA_QUERY) private readonly multimedia: MultimediaQueryPort,
    @Inject(CONFIGURACION_QUERY) private readonly configuracion: ConfiguracionQueryPort,
  ) {}

  /**
   * Devuelve un mapa `propiedadId → portadaUrl`. Toda propiedad del input queda en el mapa: con la
   * URL de su portada, o con la imagen genérica de fallback si no tiene fotos.
   */
  async resolverPortadas(propiedadIds: string[]): Promise<Map<string, string>> {
    if (propiedadIds.length === 0) {
      return new Map();
    }

    const config = await this.configuracion.obtenerConfiguracionPublica();
    const fallback = config.imagenGenericaUrl;

    const entradas = await Promise.all(
      propiedadIds.map(async (propiedadId): Promise<[string, string]> => {
        const fotos = await this.multimedia.listarFotosDePropiedad(propiedadId);
        const portada = fotos.find((foto) => foto.esPortada) ?? fotos[0];
        return [propiedadId, portada ? portada.urlCard : fallback];
      }),
    );

    return new Map(entradas);
  }
}
