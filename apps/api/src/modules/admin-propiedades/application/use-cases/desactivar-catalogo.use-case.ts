import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { EtiquetasCatalogo } from "../../domain/types/catalogo-etiquetas";
import type { RelojPort } from "../../domain/ports/reloj.port";
import { CatalogoNoEncontradoError } from "../../domain/errors/dominio-propiedades.errors";

/**
 * DELETE /admin/tipos-propiedad/{id} | /admin/amenidades/{id} — borrado lógico (`activo = false`,
 * ADR-005) para no romper propiedades en uso. Exclusivo del Administrador (RBAC en el controller).
 */
export class DesactivarCatalogoUseCase {
  constructor(
    private readonly repo: CatalogoRepositoryPort,
    private readonly reloj: RelojPort,
    private readonly etiquetas: EtiquetasCatalogo,
  ) {}

  async ejecutar(id: string): Promise<void> {
    const item = await this.repo.buscarPorId(id);
    if (!item) {
      throw new CatalogoNoEncontradoError(this.etiquetas.noEncontrado);
    }
    item.desactivar(this.reloj.ahora());
    await this.repo.guardar(item);
  }
}
