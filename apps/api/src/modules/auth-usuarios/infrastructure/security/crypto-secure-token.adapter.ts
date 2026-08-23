import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import type { SecureTokenPort } from "../../domain/ports/secure-token.port";

const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I/O — evita confusión visual
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const DIGITOS = "23456789";
const TODOS = MAYUSCULAS + MINUSCULAS + DIGITOS;

@Injectable()
export class CryptoSecureTokenAdapter implements SecureTokenPort {
  generarUuid(): string {
    return randomUUID();
  }

  generarTokenOpaco(): string {
    return randomBytes(32).toString("base64url");
  }

  hashSha256(valor: string): string {
    return createHash("sha256").update(valor).digest("hex");
  }

  /**
   * Genera una contraseña temporal que cumple RN-034 por construcción (>= 1 mayúscula, >= 1
   * minúscula, >= 1 dígito, longitud total >= 8) usando `crypto.randomInt` (CSPRNG).
   */
  generarPasswordTemporal(longitud: number): string {
    const min = Math.max(longitud, 8);
    const obligatorios = [pick(MAYUSCULAS), pick(MINUSCULAS), pick(DIGITOS)];
    const resto = Array.from({ length: min - obligatorios.length }, () => pick(TODOS));
    return mezclar([...obligatorios, ...resto]).join("");
  }
}

function pick(alfabeto: string): string {
  return alfabeto[randomInt(alfabeto.length)];
}

/** Fisher-Yates con `randomInt` (CSPRNG) — evita que los caracteres obligatorios queden al inicio. */
function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
