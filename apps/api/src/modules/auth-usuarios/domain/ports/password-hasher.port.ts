export const PASSWORD_HASHER = Symbol("PasswordHasherPort");

/** Puerto de hashing de contraseñas (ADR-004: Argon2id o bcrypt con costo >= 12). */
export interface PasswordHasherPort {
  hash(passwordPlano: string): Promise<string>;
  verificar(passwordPlano: string, hash: string): Promise<boolean>;
}
