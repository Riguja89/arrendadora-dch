import { Inject, Injectable } from "@nestjs/common";
import {
  PROPIEDAD_CATALOGO_REPOSITORY,
  type PropiedadCatalogoRepositoryPort,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import { DESTACADAS_MAXIMO } from "../../domain/rules/visibilidad-publica";
import { EnriquecedorPortadasService } from "../services/enriquecedor-portadas.service";
import type { TarjetaCatalogo } from "./buscar-catalogo.use-case";

/**
 * CU-003 (HU-003) — Propiedades destacadas de la página de inicio. Muestra hasta 6 propiedades
 * marcadas como destacada y visibles (RN-023). Si hay menos de 6, completa con las más recientes en
 * estado `disponible` (fallback, RN-023, flujo alternativo 2a/2b). Si no hay ninguna disponible, la
 * lista queda vacía (flujo de excepción 2c — el mensaje de cortesía lo renderiza el frontend).
 */
@Injectable()
export class ListarDestacadasUseCase {
  constructor(
    @Inject(PROPIEDAD_CATALOGO_REPOSITORY)
    private readonly propiedades: PropiedadCatalogoRepositoryPort,
    private readonly enriquecedorPortadas: EnriquecedorPortadasService,
  ) {}

  async ejecutar(): Promise<TarjetaCatalogo[]> {
    const destacadas = await this.propiedades.listarDestacadas(DESTACADAS_MAXIMO);

    let seleccionadas = destacadas;
    if (destacadas.length < DESTACADAS_MAXIMO) {
      const faltantes = DESTACADAS_MAXIMO - destacadas.length;
      const excluirIds = destacadas.map((p) => p.id);
      const relleno = await this.propiedades.listarRecientesDisponibles(faltantes, excluirIds);
      seleccionadas = [...destacadas, ...relleno];
    }

    const portadas = await this.enriquecedorPortadas.resolverPortadas(
      seleccionadas.map((p) => p.id),
    );

    return seleccionadas.map((propiedad) => ({
      propiedad,
      portadaUrl: portadas.get(propiedad.id) ?? "",
    }));
  }
}
