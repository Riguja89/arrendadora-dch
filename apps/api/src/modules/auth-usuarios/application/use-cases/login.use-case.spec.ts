import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginUseCase } from "./login.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import {
  CredencialesInvalidasError,
  CuentaBloqueadaError,
  CuentaDesactivadaError,
} from "../../domain/errors/dominio-auth.errors";
import { EmailInvalidoError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import type { SecureTokenPort } from "../../domain/ports/secure-token.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function usuarioActivo(overrides: Partial<{ intentosFallidos: number; estado: "activo" | "bloqueado" | "desactivado" }> = {}) {
  return Usuario.reconstituir({
    id: "user-1",
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash-almacenado",
    rol: "agente",
    estado: overrides.estado ?? "activo",
    whatsapp: null,
    intentosFallidos: overrides.intentosFallidos ?? 0,
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
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    eliminar: vi.fn(),
    eliminarTodasDeUsuario: vi.fn(),
  };
  const hasher: PasswordHasherPort = {
    hash: vi.fn(),
    verificar: vi.fn(),
  };
  const secureToken: SecureTokenPort = {
    generarUuid: vi.fn().mockReturnValue("sesion-uuid-1"),
    generarTokenOpaco: vi.fn(),
    hashSha256: vi.fn(),
    generarPasswordTemporal: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };

  return { usuarios, sesiones, hasher, secureToken, reloj };
}

describe("LoginUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new LoginUseCase(deps.usuarios, deps.sesiones, deps.hasher, deps.secureToken, deps.reloj);
  });

  it("lanza EmailInvalidoError si el email no tiene formato válido, sin consultar el repositorio", async () => {
    await expect(
      useCase.ejecutar({ email: "invalido", password: "x", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(EmailInvalidoError);
    expect(deps.usuarios.buscarPorEmail).not.toHaveBeenCalled();
  });

  it("lanza CredencialesInvalidasError sin revelar si el email existe (CU-001 Escenario 3)", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ email: "ana@arrendadora.com", password: "x", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it("lanza CuentaBloqueadaError si el usuario está bloqueado", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuarioActivo({ estado: "bloqueado" }));

    await expect(
      useCase.ejecutar({ email: "ana@arrendadora.com", password: "x", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(CuentaBloqueadaError);
  });

  it("lanza CuentaDesactivadaError si el usuario está desactivado (RN-037)", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuarioActivo({ estado: "desactivado" }));

    await expect(
      useCase.ejecutar({ email: "ana@arrendadora.com", password: "x", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(CuentaDesactivadaError);
  });

  it("password incorrecta: incrementa intentos, guarda y lanza CredencialesInvalidasError", async () => {
    const usuario = usuarioActivo({ intentosFallidos: 1 });
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario);
    vi.mocked(deps.hasher.verificar).mockResolvedValue(false);

    await expect(
      useCase.ejecutar({ email: "ana@arrendadora.com", password: "mala", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);

    expect(usuario.intentosFallidos).toBe(2);
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(usuario);
    expect(deps.sesiones.guardar).not.toHaveBeenCalled();
  });

  it("password incorrecta en el 5º intento bloquea la cuenta (GAP-006/ADR-004)", async () => {
    const usuario = usuarioActivo({ intentosFallidos: 4 });
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario);
    vi.mocked(deps.hasher.verificar).mockResolvedValue(false);

    await expect(
      useCase.ejecutar({ email: "ana@arrendadora.com", password: "mala", ip: null, userAgent: null }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);

    expect(usuario.estaBloqueado()).toBe(true);
  });

  it("login exitoso: resetea intentos, crea sesión y retorna usuario + sesión", async () => {
    const usuario = usuarioActivo({ intentosFallidos: 3 });
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario);
    vi.mocked(deps.hasher.verificar).mockResolvedValue(true);

    const resultado = await useCase.ejecutar({
      email: "ana@arrendadora.com",
      password: "correcta",
      ip: "10.0.0.5",
      userAgent: "vitest-agent",
    });

    expect(usuario.intentosFallidos).toBe(0);
    expect(deps.usuarios.guardar).toHaveBeenCalledWith(usuario);
    expect(deps.sesiones.guardar).toHaveBeenCalledTimes(1);
    expect(resultado.usuario).toBe(usuario);
    expect(resultado.sesion.usuarioId).toBe(usuario.id);
    expect(resultado.sesion.ip).toBe("10.0.0.5");
    expect(resultado.sesion.userAgent).toBe("vitest-agent");
  });
});
