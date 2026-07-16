import { Inject, Injectable } from "@nestjs/common";
import { Email } from "../../domain/value-objects/email.vo";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import { RESET_TOKEN_TTL_MINUTOS } from "../../domain/rules/auth-constantes";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepositoryPort,
} from "../../domain/ports/password-reset-token.repository.port";
import { SECURE_TOKEN, type SecureTokenPort } from "../../domain/ports/secure-token.port";
import { EMAIL_SENDER, type EmailSenderPort } from "../../domain/ports/email-sender.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface SolicitarRecuperacionInput {
  email: string;
  /** URL base del panel para construir el enlace (ej. `https://panel.arrendadora.com`). */
  urlBasePanel: string;
}

/**
 * CU-002 — Solicitar recuperación de contraseña. RN-019: respuesta neutra siempre, sin
 * revelar si el email existe o no. Solo se envía correo si el usuario existe y está `activo`.
 */
@Injectable()
export class SolicitarRecuperacionPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokens: PasswordResetTokenRepositoryPort,
    @Inject(SECURE_TOKEN) private readonly secureToken: SecureTokenPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: SolicitarRecuperacionInput): Promise<void> {
    const email = Email.crear(input.email);
    const usuario = await this.usuarios.buscarPorEmail(email.valor);

    // RN-019 excepción: si no existe o no está activo, no se envía correo — pero tampoco se
    // informa al llamador (el controller siempre responde 202 de forma neutra).
    if (!usuario || !usuario.estaActivo()) {
      return;
    }

    // Higiene (RN-019): invalidar cualquier token activo previo antes de emitir el nuevo, para
    // que solo el último enlace enviado sea válido.
    await this.tokens.invalidarTokensActivosDeUsuario(usuario.id);

    const tokenPlano = this.secureToken.generarTokenOpaco();
    const tokenHash = this.secureToken.hashSha256(tokenPlano);
    const ahora = this.reloj.ahora();

    const resetToken = PasswordResetToken.crear({
      id: this.secureToken.generarUuid(),
      usuarioId: usuario.id,
      tokenHash,
      ahora,
      ttlMinutos: RESET_TOKEN_TTL_MINUTOS,
    });
    await this.tokens.guardar(resetToken);

    const enlace = `${input.urlBasePanel.replace(/\/$/, "")}/reset-password?token=${tokenPlano}`;
    await this.emailSender.enviar({
      destinatario: usuario.email,
      asunto: "Recuperación de contraseña — Panel Arrendadora",
      cuerpo:
        `Hola ${usuario.nombre},\n\n` +
        `Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por ` +
        `${RESET_TOKEN_TTL_MINUTOS} minutos y de un solo uso:\n\n${enlace}\n\n` +
        `Si no solicitaste este cambio, podés ignorar este correo.`,
    });
  }
}
