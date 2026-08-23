import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListarUsuariosUseCase } from "./listar-usuarios.use-case";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  return { usuarios };
}

describe("ListarUsuariosUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ListarUsuariosUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ListarUsuariosUseCase(deps.usuarios);
  });

  it("calcula skip=0 para la primera página", async () => {
    await useCase.ejecutar({ pagina: 1, tamanoPagina: 20 });

    expect(deps.usuarios.listar).toHaveBeenCalledWith({
      estado: undefined,
      rol: undefined,
      skip: 0,
      take: 20,
    });
  });

  it("calcula skip correctamente para páginas posteriores", async () => {
    await useCase.ejecutar({ pagina: 3, tamanoPagina: 10 });

    expect(deps.usuarios.listar).toHaveBeenCalledWith({
      estado: undefined,
      rol: undefined,
      skip: 20,
      take: 10,
    });
  });

  it("propaga los filtros de estado y rol al repositorio", async () => {
    await useCase.ejecutar({ pagina: 1, tamanoPagina: 20, estado: "bloqueado", rol: "editor" });

    expect(deps.usuarios.listar).toHaveBeenCalledWith({
      estado: "bloqueado",
      rol: "editor",
      skip: 0,
      take: 20,
    });
  });

  it("retorna el resultado del repositorio tal cual (items + total)", async () => {
    const items = [{ id: "u1" }] as any;
    vi.mocked(deps.usuarios.listar).mockResolvedValue({ items, total: 1 });

    const resultado = await useCase.ejecutar({ pagina: 1, tamanoPagina: 20 });

    expect(resultado).toEqual({ items, total: 1 });
  });
});
