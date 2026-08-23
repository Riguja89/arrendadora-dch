import { describe, expect, it, vi } from "vitest";
import { EditarCatalogoUseCase } from "./editar-catalogo.use-case";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import { ETIQUETAS_AMENIDAD } from "../../domain/types/catalogo-etiquetas";
import {
  CatalogoNoEncontradoError,
  NombreCatalogoDuplicadoError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function itemDe(id: string, nombre: string): CatalogoItem {
  return CatalogoItem.reconstituir({ id, nombre, activo: true, orden: 1, createdAt: AHORA, updatedAt: AHORA });
}

function buildDeps(item: CatalogoItem | null) {
  const repo: CatalogoRepositoryPort = {
    listar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(item), buscarPorNombre: vi.fn().mockResolvedValue(null),
    guardar: vi.fn().mockResolvedValue(undefined), existenActivos: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { repo, reloj };
}

describe("EditarCatalogoUseCase", () => {
  it("lanza CatalogoNoEncontradoError si el ítem no existe", async () => {
    const deps = buildDeps(null);
    const uc = new EditarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_AMENIDAD);
    await expect(uc.ejecutar({ id: "x", nombre: "Piscina" })).rejects.toBeInstanceOf(CatalogoNoEncontradoError);
  });

  it("lanza NombreCatalogoDuplicadoError si otro ítem ya usa el nombre (ADR-005)", async () => {
    const deps = buildDeps(itemDe("c-1", "Piscina"));
    vi.mocked(deps.repo.buscarPorNombre).mockResolvedValue(itemDe("c-2", "Gimnasio"));
    const uc = new EditarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_AMENIDAD);
    await expect(uc.ejecutar({ id: "c-1", nombre: "Gimnasio" })).rejects.toBeInstanceOf(
      NombreCatalogoDuplicadoError,
    );
    expect(deps.repo.guardar).not.toHaveBeenCalled();
  });

  it("permite conservar el mismo nombre del propio ítem", async () => {
    const deps = buildDeps(itemDe("c-1", "Piscina"));
    vi.mocked(deps.repo.buscarPorNombre).mockResolvedValue(itemDe("c-1", "Piscina"));
    const uc = new EditarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_AMENIDAD);
    const item = await uc.ejecutar({ id: "c-1", nombre: "Piscina", orden: 3 });
    expect(item.toProps().orden).toBe(3);
    expect(deps.repo.guardar).toHaveBeenCalledTimes(1);
  });

  it("edita y persiste el ítem", async () => {
    const deps = buildDeps(itemDe("c-1", "Piscina"));
    const uc = new EditarCatalogoUseCase(deps.repo, deps.reloj, ETIQUETAS_AMENIDAD);
    const item = await uc.ejecutar({ id: "c-1", activo: false });
    expect(item.activo).toBe(false);
  });
});
