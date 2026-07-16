import { Inject, Injectable } from "@nestjs/common";
import { Password } from "../../domain/value-objects/password.vo";
import { TokenRecuperacionInvalidoError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepositoryPort,
} from "../../domain/ports/password-reset-token.repository.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import { SECURE_TOKEN, type SecureTokenPort } from "../../domain/ports/secure-token.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface RestablecerPasswordInput {
  tokenPlano: string;
  passwordNueva: string;
}

/** CU-002 (pasos 7-11) — restablece la contraseña usando un token válido y no usado (RN-019). */
@Injectable()
export class RestablecerPasswordConTokenUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokens: PasswordResetTokenRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(SECURE_TOKEN) private readonly secureToken: SecureTokenPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: RestablecerPasswordInput): Promise<void> {
    const tokenHash = this.secureToken.hashSha256(input.tokenPlano);
    const resetToken = await this.tokens.buscarPorHash(tokenHash);

    const ahora = this.reloj.ahora();
    if (!resetToken || !resetToken.esValido(ahora)) {
      throw new TokenRecuperacionInvalidoError();
    }

    const usuario = await this.usuarios.buscarPorId(resetToken.usuarioId);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }

    const nueva = Password.crear(input.passwordNueva, "password_nueva");
    const hash = await this.hasher.hash(nueva.plano);
    usuario.cambiarPassword(hash, ahora);
    await this.usuarios.guardar(usuario);

    resetToken.marcarUsado();
    await this.tokens.guardar(resetToken);

    // Revoca sesiones activas: el usuario acaba de demostrar control del email, no de la
    // sesión previa — no hay razón para mantenerla viva (mismo criterio que change-password).
    await this.sesiones.eliminarTodasDeUsuario(usuario.id);
  }
}
