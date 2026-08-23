import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObtenerUsuarioUseCase } from "./obtener-usuario.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn(),
  };
  return { usuarios };
}

describe("ObtenerUsuarioUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ObtenerUsuarioUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ObtenerUsuarioUseCase(deps.usuarios);
  });

  it("lanza UsuarioNoEncontradoError si no existe", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(useCase.ejecutar("no-existe")).rejects.toBeInstanceOf(UsuarioNoEncontradoError);
  });

  it("retorna el usuario encontrado", async () => {
    const usuario = Usuario.reconstituir({
      id: "user-1",
      nombre: "Ana",
      email: "ana@arrendadora.com",
      passwordHash: "hash",
      rol: "agente",
      estado: "activo",
      whatsapp: null,
      intentosFallidos: 0,
      requiereCambioPassword: false,
      createdAt: AHORA,
      updatedAt: AHORA,
    });
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuario);

    const resultado = await useCase.ejecutar("user-1");

    expect(resultado).toBe(usuario);
  });
});
