export const ID_GENERATOR = Symbol("IdGeneratorPort");

/** Puerto de generación de identificadores (UUID) — inyectable para tests deterministas. */
export interface IdGeneratorPort {
  nuevo(): string;
}
