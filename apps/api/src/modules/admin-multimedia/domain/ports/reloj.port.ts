export const RELOJ = Symbol("RelojPort");

/** Puerto de reloj — permite testear reglas con tiempo determinista. */
export interface RelojPort {
  ahora(): Date;
}
