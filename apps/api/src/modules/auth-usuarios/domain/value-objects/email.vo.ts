import { EmailInvalidoError } from "../errors/dominio-auth.errors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Value Object Email — normaliza (trim + lowercase) y valida formato antes de tocar el dominio. */
export class Email {
  private constructor(private readonly valorNormalizado: string) {}

  static crear(input: string, campo = "email"): Email {
    const normalizado = (input ?? "").trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizado)) {
      throw new EmailInvalidoError(campo);
    }
    return new Email(normalizado);
  }

  get valor(): string {
    return this.valorNormalizado;
  }

  toString(): string {
    return this.valorNormalizado;
  }
}
