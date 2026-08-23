import { Inject, Injectable } from "@nestjs/common";
import {
  PROPIEDAD_CATALOGO_REPOSITORY,
  type PropiedadCatalogoRepositoryPort,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import type { TipoPropiedadPublico } from "../../domain/read-models/tipo-propiedad-publico.read-model";

/**
 * Tipos de propiedad activos para poblar el filtro del catálogo (contrato DESIGN-029
 * `/public/tipos-propiedad`, catálogos administrables ADR-005).
 */
@Injectable()
export class ListarTiposPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_CATALOGO_REPOSITORY)
    private readonly propiedades: PropiedadCatalogoRepositoryPort,
  ) {}

  async ejecutar(): Promise<TipoPropiedadPublico[]> {
    return this.propiedades.listarTiposPropiedadActivos();
  }
}
