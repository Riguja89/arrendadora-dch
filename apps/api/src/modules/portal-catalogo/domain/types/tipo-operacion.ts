/**
 * Tipo de operación de una propiedad expuesta en el portal público (contrato DESIGN-029,
 * schema `TipoOperacion`). Tipo de dominio puro — sin dependencias de framework.
 */
export type TipoOperacion = "arriendo" | "venta";

/** Valores válidos, para la validación del query param `tipo_operacion`. */
export const TIPOS_OPERACION_VALIDOS: readonly TipoOperacion[] = ["arriendo", "venta"];
