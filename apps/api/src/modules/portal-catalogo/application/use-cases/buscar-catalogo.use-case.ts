import { Inject, Injectable } from "@nestjs/common";
import {
  PROPIEDAD_CATALOGO_REPOSITORY,
  type PropiedadCatalogoRepositoryPort,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import type { PropiedadCatalogo } from "../../domain/read-models/propiedad-catalogo.read-model";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import { EnriquecedorPortadasService } from "../services/enriquecedor-portadas.service";

/** Una tarjeta del catálogo: el read model de la propiedad + su URL de portada resuelta (RN-014). */
export interface TarjetaCatalogo {
  propiedad: PropiedadCatalogo;
  portadaUrl: string;
}

export interface BuscarCatalogoInput {
  tipoOperacion?: TipoOperacion;
  tipoPropiedad?: string;
  ciudad?: string;
  barrio?: string;
  q?: string;
  precioMin?: number;
  precioMax?: number;
  pagina: number;
  tamanoPagina: number;
}

export interface BuscarCatalogoResultado {
  items: TarjetaCatalogo[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}

/**
 * CU-001 / CU-002 (HU-001, HU-002) — Búsqueda pública paginada con filtros acumulativos (RN-024) y
 * búsqueda por texto libre. Solo devuelve propiedades visibles (RN-005), ordenadas por publicación
 * descendente; el repositorio aplica la visibilidad, este caso de uso orquesta la paginación y la
 * resolución de portadas (RN-014).
 */
@Injectable()
export class BuscarCatalogoUseCase {
  constructor(
    @Inject(PROPIEDAD_CATALOGO_REPOSITORY)
    private readonly propiedades: PropiedadCatalogoRepositoryPort,
    private readonly enriquecedorPortadas: EnriquecedorPortadasService,
  ) {}

  async ejecutar(input: BuscarCatalogoInput): Promise<BuscarCatalogoResultado> {
    const skip = (input.pagina - 1) * input.tamanoPagina;

    const { items, total } = await this.propiedades.buscar({
      tipoOperacion: input.tipoOperacion,
      tipoPropiedad: input.tipoPropiedad,
      ciudad: input.ciudad,
      barrio: input.barrio,
      q: input.q,
      precioMin: input.precioMin,
      precioMax: input.precioMax,
      skip,
      take: input.tamanoPagina,
    });

    const portadas = await this.enriquecedorPortadas.resolverPortadas(items.map((p) => p.id));

    return {
      items: items.map((propiedad) => ({
        propiedad,
        portadaUrl: portadas.get(propiedad.id) ?? "",
      })),
      total,
      pagina: input.pagina,
      tamanoPagina: input.tamanoPagina,
    };
  }
}
