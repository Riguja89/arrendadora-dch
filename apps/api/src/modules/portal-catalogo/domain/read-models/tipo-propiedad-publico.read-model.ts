/**
 * Proyección pública de un tipo de propiedad activo, para poblar el filtro del catálogo
 * (contrato DESIGN-029 schema `TipoPropiedadPublico`, catálogos administrables ADR-005).
 */
export interface TipoPropiedadPublico {
  id: string;
  nombre: string;
}
