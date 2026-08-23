import { beforeEach, describe, expect, it, vi } from "vitest";
import { SolicitarRecuperacionPasswordUseCase } from "./solicitar-recuperacion-password.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { EmailInvalidoError } from "../../domain/errors/dominio-auth.errors";
import { RESET_TOKEN_TTL_MINUTOS } from "../../domain/rules/auth-constantes";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { PasswordResetTokenRepositoryPort } from "../../domain/ports/password-reset-token.repository.port";
import type { SecureTokenPort } from "../../domain/ports/secure-token.port";
import type { EmailSenderPort } from "../../domain/ports/email-sender.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function usuario(estado: "activo" | "bloqueado" | "desactivado" = "activo") {
  return Usuario.reconstituir({
    id: "user-1",
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash",
    rol: "agente",
    estado,
    whatsapp: null,
    intentosFallidos: 0,
    requiereCambioPassword: false,
    createdAt: AHORA,
    updatedAt: AHORA,
  });
}

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn(),
  };
  const tokens: PasswordResetTokenRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorHash: vi.fn(),
    invalidarTokensActivosDeUsuario: vi.fn().mockResolvedValue(undefined),
  };
  const secureToken: SecureTokenPort = {
    generarUuid: vi.fn().mockReturnValue("token-uuid-1"),
    generarTokenOpaco: vi.fn().mockReturnValue("token-plano-opaco"),
    hashSha256: vi.fn().mockReturnValue("hash-del-token"),
    generarPasswordTemporal: vi.fn(),
  };
  const emailSender: EmailSenderPort = { enviar: vi.fn().mockResolvedValue(undefined) };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { usuarios, tokens, secureToken, emailSender, reloj };
}

describe("SolicitarRecuperacionPasswordUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: SolicitarRecuperacionPasswordUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new SolicitarRecuperacionPasswordUseCase(
      deps.usuarios,
      deps.tokens,
      deps.secureToken,
      deps.emailSender,
      deps.reloj,
    );
  });

  it("lanza EmailInvalidoError si el email no tiene formato válido", async () => {
    await expect(
      useCase.ejecutar({ email: "invalido", urlBasePanel: "https://panel.arrendadora.com" }),
    ).rejects.toBeInstanceOf(EmailInvalidoError);
  });

  it("responde neutro (sin error, sin correo) si el usuario no existe (RN-019)", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ email: "no-existe@arrendadora.com", urlBasePanel: "https://panel.arrendadora.com" }),
    ).resolves.toBeUndefined();

    expect(deps.tokens.guardar).not.toHaveBeenCalled();
    expect(deps.emailSender.enviar).not.toHaveBeenCalled();
  });

  it("responde neutro si el usuario existe pero no está activo", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario("bloqueado"));

    await useCase.ejecutar({ email: "ana@arrendadora.com", urlBasePanel: "https://panel.arrendadora.com" });

    expect(deps.tokens.guardar).not.toHaveBeenCalled();
    expect(deps.emailSender.enviar).not.toHaveBeenCalled();
  });

  it("genera token, lo persiste y envía el correo con el enlace (usuario activo)", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario("activo"));

    await useCase.ejecutar({ email: "ana@arrendadora.com", urlBasePanel: "https://panel.arrendadora.com" });

    expect(deps.tokens.invalidarTokensActivosDeUsuario).toHaveBeenCalledWith("user-1");
    expect(deps.tokens.guardar).toHaveBeenCalledTimes(1);
    const tokenGuardado = vi.mocked(deps.tokens.guardar).mock.calls[0][0];
    expect(tokenGuardado.tokenHash).toBe("hash-del-token");
    expect(tokenGuardado.expiraEn).toEqual(new Date(AHORA.getTime() + RESET_TOKEN_TTL_MINUTOS * 60_000));

    expect(deps.emailSender.enviar).toHaveBeenCalledTimes(1);
    const enviado = vi.mocked(deps.emailSender.enviar).mock.calls[0][0];
    expect(enviado.destinatario).toBe("ana@arrendadora.com");
    expect(enviado.cuerpo).toContain("https://panel.arrendadora.com/reset-password?token=token-plano-opaco");
  });

  it("normaliza urlBasePanel removiendo el slash final antes de construir el enlace", async () => {
    vi.mocked(deps.usuarios.buscarPorEmail).mockResolvedValue(usuario("activo"));

    await useCase.ejecutar({ email: "ana@arrendadora.com", urlBasePanel: "https://panel.arrendadora.com/" });

    const enviado = vi.mocked(deps.emailSender.enviar).mock.calls[0][0];
    expect(enviado.cuerpo).toContain("https://panel.arrendadora.com/reset-password?token=token-plano-opaco");
    expect(enviado.cuerpo).not.toContain("//reset-password");
  });
});
