export const SECURE_TOKEN = Symbol("SecureTokenPort");

/**
 * Puerto de generación de identificadores/tokens seguros. Centraliza el único uso de
 * primitivas criptográficas fuera del dominio (implementado en infraestructura con
 * `node:crypto`) para mantener el dominio puro y testeable con dobles deterministas.
 */
export interface SecureTokenPort {
  /** IDs de entidades (Usuario, Sesion, PasswordResetToken) — UUID v4. */
  generarUuid(): string;
  /** Token opaco de un solo uso para recuperación de contraseña (RN-019) — nunca se persiste. */
  generarTokenOpaco(): string;
  /** Hash determinista (SHA-256) usado para buscar el token de recuperación por su huella. */
  hashSha256(valor: string): string;
  /** Contraseña temporal (CU-003, GAP-004 opción A) — cumple RN-034 por construcción. */
  generarPasswordTemporal(longitud: number): string;
}
