/** Estados del ciclo de vida de una Propiedad (RN-012, ERD DESIGN-026). */
export type EstadoPropiedad = "disponible" | "reservada" | "arrendada_vendida";

export const ESTADOS_PROPIEDAD_VALIDOS: readonly EstadoPropiedad[] = [
  "disponible",
  "reservada",
  "arrendada_vendida",
];

export function esEstadoPropiedadValido(valor: string): valor is EstadoPropiedad {
  return (ESTADOS_PROPIEDAD_VALIDOS as readonly string[]).includes(valor);
}
