import { Inject, Injectable } from "@nestjs/common";
import {
  PROPIEDAD_CATALOGO_REPOSITORY,
  type PropiedadCatalogoRepositoryPort,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import type { CiudadConteo } from "../../domain/read-models/ciudad-conteo.read-model";

/**
 * Ciudades con al menos una propiedad visible, para poblar el filtro de ciudad del catálogo
 * (contrato DESIGN-029 `/public/ciudades`, GAP-002). Lista dinámica derivada de las publicadas.
 */
@Injectable()
export class ListarCiudadesUseCase {
  constructor(
    @Inject(PROPIEDAD_CATALOGO_REPOSITORY)
    private readonly propiedades: PropiedadCatalogoRepositoryPort,
  ) {}

  async ejecutar(): Promise<CiudadConteo[]> {
    return this.propiedades.listarCiudadesConVisibles();
  }
}
