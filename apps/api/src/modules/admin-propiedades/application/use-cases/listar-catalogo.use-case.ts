import type { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";

/**
 * GET /admin/tipos-propiedad | /admin/amenidades — lista un catálogo administrable (ADR-005). Por
 * defecto solo los activos; `incluirInactivos` los muestra todos. Caso de uso genérico: se
 * instancia una vez por catálogo vía factory provider (ver `admin-propiedades.module.ts`).
 */
export class ListarCatalogoUseCase {
  constructor(private readonly repo: CatalogoRepositoryPort) {}

  async ejecutar(incluirInactivos: boolean): Promise<CatalogoItem[]> {
    return this.repo.listar(incluirInactivos);
  }
}
