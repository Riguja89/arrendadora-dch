/**
 * Tipo de operación de una propiedad expuesta en la ficha pública (contrato DESIGN-029,
 * schema `TipoOperacion`). Tipo de dominio puro — sin dependencias de framework.
 *
 * Se declara local a este bounded context (no se importa el de `portal-catalogo`) para preservar el
 * aislamiento entre contextos (DESIGN-027): cada BC es dueño de su propio lenguaje ubicuo.
 */
export type TipoOperacion = "arriendo" | "venta";
