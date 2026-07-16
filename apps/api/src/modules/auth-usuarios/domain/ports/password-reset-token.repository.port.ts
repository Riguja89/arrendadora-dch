import type { PasswordResetToken } from "../entities/password-reset-token.entity";

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol("PasswordResetTokenRepositoryPort");

/** Puerto de persistencia de PasswordResetToken (RN-019). */
export interface PasswordResetTokenRepositoryPort {
  guardar(token: PasswordResetToken): Promise<void>;
  /** Busca por el hash del token plano (nunca se persiste ni se busca en texto plano). */
  buscarPorHash(tokenHash: string): Promise<PasswordResetToken | null>;
  /**
   * Invalida (marca como usados) todos los tokens aún activos del usuario. Higiene: al emitir
   * un token nuevo, los anteriores dejan de ser válidos de inmediato (RN-019).
   */
  invalidarTokensActivosDeUsuario(usuarioId: string): Promise<void>;
}
