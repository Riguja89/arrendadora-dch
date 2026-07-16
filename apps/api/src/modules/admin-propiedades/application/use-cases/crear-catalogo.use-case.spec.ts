import { describe, expect, it, vi } from "vitest";
import { CrearCatalogoUseCase } from "./crear-catalogo.use-case";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import { ETIQUETAS_TIPO_PROPIEDAD } from "../../domain/types/catalogo-etiquetas";
import { NombreCatalogoDuplicadoError } from "../../domain/errors/dominio-propiedades.errors";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const EXISTENTE = CatalogoItem.reconstituir({
  id: "c-1", nombre: "Apartamento", activo: true, orden: 1, createdAt: AHORA, updatedAt: AHORA,
});

function buildDeps() {
  const repo: CatalogoRepositoryPort = {
    listar: vi.fn(), buscarPorId: vi.fn(), buscarPorNombre: vi.fn().mockResolvedValue(null),
    guardar: vi.fn().mockResolvedValue(undefined), existenActivos: vi.fn(),
  };
  const idGenerator: IdGeneratorPort = { nuevo: vi.fn().mockReturnValue("c-uuid-1") };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { repo, idGenerator, reloj };
}

describe("CrearCatalogoUseCase", () => {
  it("lanza NombreCatalogoDuplicadoError si el nombre ya existe (ADR-005), sin persistir", async () => {
    const deps = buildDeps();
    vi.mocked(deps.repo.buscarPorNombre).mockResolvedValue(EXISTENTE);
    const uc = new CrearCatalogoUseCase(deps.repo, deps.idGenerator, deps.reloj, ETIQUETAS_TIPO_PROPIEDAD);
    await expect(uc.ejecutar({ nombre: "Apartamento", orden: 1 })).rejects.toBeInstanceOf(
      NombreCatalogoDuplicadoError,
    );
    expect(deps.repo.guardar).not.toHaveBeenCalled();
  });

  it("crea el ítem activo y lo persiste", async () => {
    const deps = buildDeps();
    const uc = new CrearCatalogoUseCase(deps.repo, deps.idGenerator, deps.reloj, ETIQUETAS_TIPO_PROPIEDAD);
    const item = await uc.ejecutar({ nombre: "Casa", orden: 2 });
    const props = item.toProps();
    expect(props.id).toBe("c-uuid-1");
    expect(props.nombre).toBe("Casa");
    expect(props.activo).toBe(true);
    expect(deps.repo.guardar).toHaveBeenCalledTimes(1);
  });
});
