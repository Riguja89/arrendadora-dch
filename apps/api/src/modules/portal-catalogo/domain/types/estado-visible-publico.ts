/**
 * Único estado que además de `disponible` puede exponerse en el portal público es `reservada`
 * (RN-005, contrato DESIGN-029 schema `EstadoVisiblePublico`). `arrendada_vendida` y las
 * propiedades archivadas NUNCA se proyectan al catálogo. Tipo de dominio puro.
 */
export type EstadoVisiblePublico = "disponible" | "reservada";
