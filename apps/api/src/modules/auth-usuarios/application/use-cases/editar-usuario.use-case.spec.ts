import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditarUsuarioUseCase } from "./editar-usuario.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { AutoproteccionAdministradorError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function usuario(id: string, rol: "administrador" | "agente" | "editor" = "administrador") {
  return Usuario.reconstituir({
    id,
    nombre: "Original",
    email: "user@arrendadora.com",
    passwordHash: "hash",
    rol,
    estado: "activo",
    whatsapp: null,
    intentosFallidos: 0,
    requiereCambioPassword: false,
    createdAt: AHORA,
    updatedAt: AHORA,
  });
}

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { usuarios, reloj };
}

describe("EditarUsuarioUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: EditarUsuarioUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new EditarUsuarioUseCase(deps.usuarios, deps.reloj);
  });

  it("lanza UsuarioNoEncontradoError si el usuario no existe", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ id: "no-existe", actorId: "admin-1", nombre: "Nuevo" }),
    ).rejects.toBeInstanceOf(UsuarioNoEncontradoError);
  });

  it("lanza AutoproteccionAdministradorError si el actor intenta cambiar su propio rol (CU-004 5a)", async () => {
    const propio = usuario("admin-1", "administrador");
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(propio);

    await expect(
      useCase.ejecutar({ id: "admin-1", actorId: "admin-1", rol: "editor" }),
    ).rejects.toBeInstanceOf(AutoproteccionAdministradorError);
    expect(deps.usuarios.guardar).not.toHaveBeenCalled();
  });

  it("permite que el actor edite su propio perfil si NO cambia su rol", async () => {
    const propio = usuario("admin-1", "administrador");
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(propio);

    const resultado = await useCase.ejecutar({
      id: "admin-1",
      actorId: "admin-1",
      rol: "administrador",
      nombre: "Nombre Actualizado",
    });

    expect(resultado.nombre).toBe("Nombre Actualizado");
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(propio);
  });

  it("permite editar el rol de OTRO usuario sin restricción", async () => {
    const otro = usuario("user-2", "agente");
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(otro);

    const resultado = await useCase.ejecutar({ id: "user-2", actorId: "admin-1", rol: "editor" });

    expect(resultado.rol).toBe("editor");
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(otro);
  });

  it("actualiza solo los campos provistos (edición parcial)", async () => {
    const otro = usuario("user-2", "agente");
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(otro);

    const resultado = await useCase.ejecutar({ id: "user-2", actorId: "admin-1", whatsapp: "+123" });

    expect(resultado.whatsapp).toBe("+123");
    expect(resultado.rol).toBe("agente");
    expect(resultado.nombre).toBe("Original");
  });
});
