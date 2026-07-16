/** Tipo de negocio de una propiedad (GAP-001, ERD DESIGN-026). */
export type TipoOperacion = "arriendo" | "venta";

export const TIPOS_OPERACION_VALIDOS: readonly TipoOperacion[] = ["arriendo", "venta"];

export function esTipoOperacionValido(valor: string): valor is TipoOperacion {
  return (TIPOS_OPERACION_VALIDOS as readonly string[]).includes(valor);
}
