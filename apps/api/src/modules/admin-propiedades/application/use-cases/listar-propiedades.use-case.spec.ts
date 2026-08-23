import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListarPropiedadesUseCase } from "./listar-propiedades.use-case";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";

function buildDeps() {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    listar: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    cambiarEstado: vi.fn(),
  };
  return { propiedades };
}

describe("ListarPropiedadesUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ListarPropiedadesUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ListarPropiedadesUseCase(deps.propiedades);
  });

  it("calcula skip/take desde pagina/tamanoPagina y pasa los filtros al repo", async () => {
    await useCase.ejecutar({
      actor: { id: "u-1", rol: "administrador" },
      estado: "disponible",
      tipoOperacion: "arriendo",
      tipoPropiedadId: "tipo-1",
      archivada: false,
      q: "Chapinero",
      pagina: 3,
      tamanoPagina: 20,
    });
    expect(deps.propiedades.listar).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20, estado: "disponible", q: "Chapinero" }),
    );
  });

  it("resuelve agente='me' al id del actor (RN-010)", async () => {
    await useCase.ejecutar({ actor: { id: "u-agente", rol: "agente" }, agente: "me", pagina: 1, tamanoPagina: 10 });
    expect(deps.propiedades.listar).toHaveBeenCalledWith(expect.objectContaining({ agenteId: "u-agente" }));
  });

  it("pasa el UUID de agente tal cual cuando no es 'me'", async () => {
    await useCase.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, agente: "agente-9", pagina: 1, tamanoPagina: 10 });
    expect(deps.propiedades.listar).toHaveBeenCalledWith(expect.objectContaining({ agenteId: "agente-9" }));
  });

  it("no filtra por agente cuando no se provee (todas — RN-010 excepción)", async () => {
    await useCase.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, pagina: 1, tamanoPagina: 10 });
    expect(deps.propiedades.listar).toHaveBeenCalledWith(expect.objectContaining({ agenteId: undefined }));
  });

  it("devuelve items y total del repositorio", async () => {
    vi.mocked(deps.propiedades.listar).mockResolvedValue({ items: [], total: 42 });
    const res = await useCase.ejecutar({ actor: { id: "u-1", rol: "editor" }, pagina: 1, tamanoPagina: 10 });
    expect(res.total).toBe(42);
  });
});
