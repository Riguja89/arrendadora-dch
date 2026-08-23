import type { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { EtiquetasCatalogo } from "../../domain/types/catalogo-etiquetas";
import type { RelojPort } from "../../domain/ports/reloj.port";
import {
  CatalogoNoEncontradoError,
  NombreCatalogoDuplicadoError,
} from "../../domain/errors/dominio-propiedades.errors";

export interface EditarCatalogoInput {
  id: string;
  nombre?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * PATCH /admin/tipos-propiedad/{id} | /admin/amenidades/{id} — edición de un ítem de catálogo (solo
 * Administrador). Valida existencia y unicidad de nombre (ADR-005). Genérico: una instancia por catálogo.
 */
export class EditarCatalogoUseCase {
  constructor(
    private readonly repo: CatalogoRepositoryPort,
    private readonly reloj: RelojPort,
    private readonly etiquetas: EtiquetasCatalogo,
  ) {}

  async ejecutar(input: EditarCatalogoInput): Promise<CatalogoItem> {
    const item = await this.repo.buscarPorId(input.id);
    if (!item) {
      throw new CatalogoNoEncontradoError(this.etiquetas.noEncontrado);
    }
    if (input.nombre !== undefined) {
      const otro = await this.repo.buscarPorNombre(input.nombre);
      if (otro && otro.id !== item.id) {
        throw new NombreCatalogoDuplicadoError(this.etiquetas.duplicado);
      }
    }
    item.editar({ nombre: input.nombre, orden: input.orden, activo: input.activo }, this.reloj.ahora());
    await this.repo.guardar(item);
    return item;
  }
}
