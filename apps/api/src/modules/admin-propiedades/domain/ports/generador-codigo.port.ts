export const GENERADOR_CODIGO = Symbol("GeneradorCodigoPort");

/**
 * Puerto de generación del código legible secuencial de la propiedad (GAP-005, ej. `AP-001`).
 * El adaptador de infraestructura decide la estrategia concreta (secuencia de BD / conteo).
 */
export interface GeneradorCodigoPort {
  siguiente(): Promise<string>;
}
