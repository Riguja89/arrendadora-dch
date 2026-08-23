import { beforeEach, describe, expect, it, vi } from "vitest";
import { CambiarPasswordUseCase } from "./cambiar-password.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { PasswordActualIncorrectaError, PasswordInvalidaError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function usuario() {
  return Usuario.reconstituir({
    id: "user-1",
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash-actual",
    rol: "agente",
    estado: "activo",
    whatsapp: null,
    intentosFallidos: 0,
    requiereCambioPassword: true,
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
  const sesiones: SesionRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    eliminar: vi.fn(),
    eliminarTodasDeUsuario: vi.fn().mockResolvedValue(undefined),
  };
  const hasher: PasswordHasherPort = {
    hash: vi.fn().mockResolvedValue("hash-nuevo"),
    verificar: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { usuarios, sesiones, hasher, reloj };
}

describe("CambiarPasswordUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: CambiarPasswordUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new CambiarPasswordUseCase(deps.usuarios, deps.sesiones, deps.hasher, deps.reloj);
  });

  it("lanza UsuarioNoEncontradoError si el usuario no existe", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ usuarioId: "no-existe", passwordActual: "x", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(UsuarioNoEncontradoError);
  });

  it("lanza PasswordActualIncorrectaError si la actual no coincide con el hash", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuario());
    vi.mocked(deps.hasher.verificar).mockResolvedValue(false);

    await expect(
      useCase.ejecutar({ usuarioId: "user-1", passwordActual: "mala", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(PasswordActualIncorrectaError);
    expect(deps.usuarios.guardar).not.toHaveBeenCalled();
  });

  it("lanza PasswordInvalidaError si la nueva no cumple RN-034", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuario());
    vi.mocked(deps.hasher.verificar).mockResolvedValue(true);

    await expect(
      useCase.ejecutar({ usuarioId: "user-1", passwordActual: "correcta", passwordNueva: "corta" }),
    ).rejects.toBeInstanceOf(PasswordInvalidaError);
    expect(deps.usuarios.guardar).not.toHaveBeenCalled();
  });

  it("cambia la contraseña, guarda y revoca TODAS las sesiones (incluida la actual)", async () => {
    const u = usuario();
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(u);
    vi.mocked(deps.hasher.verificar).mockResolvedValue(true);

    await useCase.ejecutar({ usuarioId: "user-1", passwordActual: "correcta", passwordNueva: "Nueva1234" });

    expect(deps.hasher.hash).toHaveBeenCalledWith("Nueva1234");
    expect(u.passwordHash).toBe("hash-nuevo");
    expect(u.requiereCambioPassword).toBe(false);
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(u);
    expect(deps.sesiones.eliminarTodasDeUsuario).toHaveBeenCalledWith("user-1");
  });
});
