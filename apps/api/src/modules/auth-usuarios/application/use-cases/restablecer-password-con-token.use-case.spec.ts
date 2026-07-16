import { beforeEach, describe, expect, it, vi } from "vitest";
import { RestablecerPasswordConTokenUseCase } from "./restablecer-password-con-token.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import { PasswordInvalidaError, TokenRecuperacionInvalidoError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import type { PasswordResetTokenRepositoryPort } from "../../domain/ports/password-reset-token.repository.port";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import type { SecureTokenPort } from "../../domain/ports/secure-token.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function tokenValido() {
  return PasswordResetToken.crear({
    id: "token-1",
    usuarioId: "user-1",
    tokenHash: "hash-del-token",
    ahora: AHORA,
    ttlMinutos: 60,
  });
}

function usuario() {
  return Usuario.reconstituir({
    id: "user-1",
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash-viejo",
    rol: "agente",
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
  const sesiones: SesionRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    eliminar: vi.fn(),
    eliminarTodasDeUsuario: vi.fn().mockResolvedValue(undefined),
  };
  const tokens: PasswordResetTokenRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorHash: vi.fn(),
    invalidarTokensActivosDeUsuario: vi.fn().mockResolvedValue(undefined),
  };
  const hasher: PasswordHasherPort = {
    hash: vi.fn().mockResolvedValue("hash-nuevo"),
    verificar: vi.fn(),
  };
  const secureToken: SecureTokenPort = {
    generarUuid: vi.fn(),
    generarTokenOpaco: vi.fn(),
    hashSha256: vi.fn().mockReturnValue("hash-del-token"),
    generarPasswordTemporal: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { usuarios, sesiones, tokens, hasher, secureToken, reloj };
}

describe("RestablecerPasswordConTokenUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: RestablecerPasswordConTokenUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new RestablecerPasswordConTokenUseCase(
      deps.usuarios,
      deps.sesiones,
      deps.tokens,
      deps.hasher,
      deps.secureToken,
      deps.reloj,
    );
  });

  it("lanza TokenRecuperacionInvalidoError si el token no existe", async () => {
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ tokenPlano: "plano", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(TokenRecuperacionInvalidoError);
  });

  it("lanza TokenRecuperacionInvalidoError si el token ya fue usado (RN-019)", async () => {
    const token = tokenValido();
    token.marcarUsado();
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(token);

    await expect(
      useCase.ejecutar({ tokenPlano: "plano", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(TokenRecuperacionInvalidoError);
  });

  it("lanza TokenRecuperacionInvalidoError si el token venció", async () => {
    const token = tokenValido();
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(token);
    vi.mocked(deps.reloj.ahora).mockReturnValue(new Date(token.expiraEn.getTime() + 1));

    await expect(
      useCase.ejecutar({ tokenPlano: "plano", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(TokenRecuperacionInvalidoError);
  });

  it("lanza UsuarioNoEncontradoError si el usuario del token ya no existe", async () => {
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(tokenValido());
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ tokenPlano: "plano", passwordNueva: "Nueva1234" }),
    ).rejects.toBeInstanceOf(UsuarioNoEncontradoError);
  });

  it("lanza PasswordInvalidaError si la nueva contraseña no cumple RN-034", async () => {
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(tokenValido());
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuario());

    await expect(
      useCase.ejecutar({ tokenPlano: "plano", passwordNueva: "corta" }),
    ).rejects.toBeInstanceOf(PasswordInvalidaError);
    expect(deps.usuarios.guardar).not.toHaveBeenCalled();
  });

  it("restablece la contraseña, marca el token usado y revoca todas las sesiones", async () => {
    const token = tokenValido();
    const u = usuario();
    vi.mocked(deps.tokens.buscarPorHash).mockResolvedValue(token);
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(u);

    await useCase.ejecutar({ tokenPlano: "token-plano", passwordNueva: "Nueva1234" });

    expect(deps.secureToken.hashSha256).toHaveBeenCalledWith("token-plano");
    expect(u.passwordHash).toBe("hash-nuevo");
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(u);
    expect(token.usado).toBe(true);
    expect(deps.tokens.guardar).toHaveBeenCalledWith(token);
    expect(deps.sesiones.eliminarTodasDeUsuario).toHaveBeenCalledWith(u.id);
  });
});
