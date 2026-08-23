import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher.port";

/**
 * Adaptador de hashing con `bcryptjs` (puro JS, sin binarios nativos). ADR-004 permite
 * "Argon2id (o bcrypt con coste >= 12)"; se eligió bcrypt puro-JS en vez de argon2/bcrypt
 * nativos para evitar fallos de compilación node-gyp en Windows sin build tools instalados
 * (ver CLAUDE.md del módulo — decisión documentada, no silenciosa).
 */
const COSTO_BCRYPT = 12;

@Injectable()
export class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  async hash(passwordPlano: string): Promise<string> {
    return bcrypt.hash(passwordPlano, COSTO_BCRYPT);
  }

  async verificar(passwordPlano: string, hash: string): Promise<boolean> {
    return bcrypt.compare(passwordPlano, hash);
  }
}
