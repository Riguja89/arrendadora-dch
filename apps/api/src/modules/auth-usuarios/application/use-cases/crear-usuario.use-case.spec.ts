import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrearUsuarioUseCase } from "./crear-usuario.use-case";
import { EmailInvalidoError, EmailYaRegistradoError } from "../../domain/errors/dominio-auth.errors";
import { PASSWORD_TEMPORAL_LONGITUD } from "../../domain/rules/auth-constantes";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import type { SecureTokenPort } from "../../domain/ports/secure-token.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn().mockResolvedValue(false),
    listar: vi.fn(),
  };
  const hasher: PasswordHasherPort = {
    hash: vi.fn().mockResolvedValue("hash-generado"),
    verificar: vi.fn(),
  };
  const secureToken: SecureTokenPort = {
    generarUuid: vi.fn().mockReturnValue("usuario-uuid-1"),
    generarTokenOpaco: vi.fn(),
    hashSha256: vi.fn(),
    generarPasswordTemporal: vi.fn().mockReturnValue("Temporal1x"),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };

  return { usuarios, hasher, secureToken, reloj };
}

describe("CrearUsuarioUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: CrearUsuarioUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new CrearUsuarioUseCase(deps.usuarios, deps.hasher, deps.secureToken, deps.reloj);
  });

  it("lanza EmailInvalidoError si el email no es válido, sin tocar el repositorio", async () => {
    await expect(
      useCase.ejecutar({ nombre: "Ana", email: "invalido", rol: "agente", whatsapp: null }),
    ).rejects.toBeInstanceOf(EmailInvalidoError);
    expect(deps.usuarios.existeEmail).not.toHaveBeenCalled();
  });

  it("lanza EmailYaRegistradoError si el email ya existe (CU-003 4b)", async () => {
    vi.mocked(deps.usuarios.existeEmail).mockResolvedValue(true);

    await expect(
      useCase.ejecutar({ nombre: "Ana", email: "ana@arrendadora.com", rol: "agente", whatsapp: null }),
    ).rejects.toBeInstanceOf(EmailYaRegistradoError);
    expect(deps.usuarios.guardar).not.toHaveBeenCalled();
  });

  it("crea el usuario con password temporal generada (GAP-004 opción A)", async () => {
    const resultado = await useCase.ejecutar({
      nombre: "Ana Pérez",
      email: "Ana@Arrendadora.com",
      rol: "editor",
      whatsapp: "+50588887777",
    });

    expect(deps.secureToken.generarPasswordTemporal).toHaveBeenCalledWith(PASSWORD_TEMPORAL_LONGITUD);
    expect(deps.hasher.hash).toHaveBeenCalledWith("Temporal1x");
    expect(deps.usuarios.guardar).toHaveBeenCalledTimes(1);

    expect(resultado.passwordTemporal).toBe("Temporal1x");
    expect(resultado.usuario.email).toBe("ana@arrendadora.com");
    expect(resultado.usuario.rol).toBe("editor");
    expect(resultado.usuario.whatsapp).toBe("+50588887777");
    expect(resultado.usuario.passwordHash).toBe("hash-generado");
    expect(resultado.usuario.requiereCambioPassword).toBe(true);
  });

  it("usa null como whatsapp cuando no se provee", async () => {
    const resultado = await useCase.ejecutar({
      nombre: "Ana",
      email: "ana@arrendadora.com",
      rol: "agente",
      whatsapp: null,
    });

    expect(resultado.usuario.whatsapp).toBeNull();
  });
});
