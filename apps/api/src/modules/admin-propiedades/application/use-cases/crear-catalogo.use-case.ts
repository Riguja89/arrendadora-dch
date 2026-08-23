import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { EtiquetasCatalogo } from "../../domain/types/catalogo-etiquetas";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
import type { RelojPort } from "../../domain/ports/reloj.port";
import { NombreCatalogoDuplicadoError } from "../../domain/errors/dominio-propiedades.errors";

/**
 * POST /admin/tipos-propiedad | /admin/amenidades — alta de un ítem de catálogo (solo Administrador,
 * RBAC en el controller). Rechaza nombres duplicados (ADR-005). Genérico: una instancia por catálogo.
 */
export class CrearCatalogoUseCase {
  constructor(
    private readonly repo: CatalogoRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly reloj: RelojPort,
    private readonly etiquetas: EtiquetasCatalogo,
  ) {}

  async ejecutar(input: { nombre: string; orden: number }): Promise<CatalogoItem> {
    const existente = await this.repo.buscarPorNombre(input.nombre);
    if (existente) {
      throw new NombreCatalogoDuplicadoError(this.etiquetas.duplicado);
    }
    const item = CatalogoItem.crear({
      id: this.idGenerator.nuevo(),
      nombre: input.nombre,
      orden: input.orden,
      ahora: this.reloj.ahora(),
    });
    await this.repo.guardar(item);
    return item;
  }
}
