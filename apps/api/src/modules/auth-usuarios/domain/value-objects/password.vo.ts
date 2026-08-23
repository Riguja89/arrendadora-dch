import { PasswordInvalidaError } from "../errors/dominio-auth.errors";

/** RN-034 — mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número. */
export function cumplePoliticaPassword(valor: string): boolean {
  return (
    typeof valor === "string" &&
    valor.length >= 8 &&
    /[A-Z]/.test(valor) &&
    /[a-z]/.test(valor) &&
    /[0-9]/.test(valor)
  );
}

/**
 * Value Object Password — envuelve una contraseña en texto plano ya validada contra RN-034.
 * Vive solo en memoria durante el caso de uso; nunca se persiste ni se loguea en texto plano.
 */
export class Password {
  private constructor(private readonly valorPlano: string) {}

  static crear(input: string, campo = "password_nueva"): Password {
    if (!cumplePoliticaPassword(input)) {
      throw new PasswordInvalidaError(campo);
    }
    return new Password(input);
  }

  get plano(): string {
    return this.valorPlano;
  }
}
