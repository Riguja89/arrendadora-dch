import { describe, expect, it, vi } from "vitest";
import { DesactivarCatalogoUseCase } from "./desactivar-catalogo.use-case";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import { ETIQUETAS_TIPO_PROPIEDAD } from "../../domain/types/catalogo-etiquetas";
import { CatalogoNoEncontradoError } from "../../domain/errors/dominio-propiedades.errors";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function buildDeps(item: CatalogoItem | null) {
  const repo: CatalogoRepositoryPort = {
    listar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(item), buscarPorNombre: vi.fn(),
    guardar: vi.fn().mockResolvedValue(undefined), existenActivos: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { repo, reloj };
}

describe("DesactivarCatalogoUseCase", () => {
  it("lanza CatalogoNoEncontradoError si el ítem no existe", async () => {
    const deps = buildDeps(null);
    const uc = new DesactivarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_TIPO_PROPIEDAD);
    await expect(uc.ejecutar("x")).rejects.toBeInstanceOf(CatalogoNoEncontradoError);
    expect(deps.repo.guardar).not.toHaveBeenCalled();
  });

  it("hace borrado lógico (activo = false) y persiste (ADR-005)", async () => {
    const item = CatalogoItem.crear({ id: "c-1", nombre: "Bodega", orden: 1, ahora: AHORA });
    const deps = buildDeps(item);
    const uc = new DesactivarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_TIPO_PROPIEDAD);
    await uc.ejecutar("c-1");
    expect(item.activo).toBe(false);
    expect(deps.repo.guardar).toHaveBeenCalledTimes(1);
  });
});
