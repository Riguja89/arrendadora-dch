export const RELOJ = Symbol("RelojPort");

/** Puerto de reloj — permite testear reglas de TTL/expiración con tiempo determinista. */
export interface RelojPort {
  ahora(): Date;
}
