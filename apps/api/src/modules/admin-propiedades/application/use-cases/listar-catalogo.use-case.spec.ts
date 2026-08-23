import { describe, expect, it, vi } from "vitest";
import { ListarCatalogoUseCase } from "./listar-catalogo.use-case";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const ITEM = CatalogoItem.reconstituir({
  id: "c-1", nombre: "Apartamento", activo: true, orden: 1, createdAt: AHORA, updatedAt: AHORA,
});

function buildRepo(): CatalogoRepositoryPort {
  return {
    listar: vi.fn().mockResolvedValue([ITEM]), buscarPorId: vi.fn(), buscarPorNombre: vi.fn(),
    guardar: vi.fn(), existenActivos: vi.fn(),
  };
}

describe("ListarCatalogoUseCase", () => {
  it("por defecto lista solo los activos (incluirInactivos = false)", async () => {
    const repo = buildRepo();
    const uc = new ListarCatalogoUseCase(repo);
    const items = await uc.ejecutar(false);
    expect(repo.listar).toHaveBeenCalledWith(false);
    expect(items).toEqual([ITEM]);
  });

  it("propaga incluirInactivos = true al repositorio (ADR-005)", async () => {
    const repo = buildRepo();
    const uc = new ListarCatalogoUseCase(repo);
    await uc.ejecutar(true);
    expect(repo.listar).toHaveBeenCalledWith(true);
  });
});
