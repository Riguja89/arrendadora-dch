/**
 * Único estado que además de `disponible` puede exponerse en la ficha pública es `reservada`
 * (RN-025, contrato DESIGN-029 schema `EstadoVisiblePublico`). `arrendada_vendida` y las
 * propiedades archivadas NUNCA se proyectan a la ficha (404, RN-025). Tipo de dominio puro.
 *
 * Local al bounded context `portal-detalle` — no se importa el de `portal-catalogo` (aislamiento
 * de contextos, DESIGN-027).
 */
export type EstadoVisiblePublico = "disponible" | "reservada";
