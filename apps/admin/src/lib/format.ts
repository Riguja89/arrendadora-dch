/** Formato de precio COP para mostrar en listado/detalle (RN-017 — se almacena entero, se muestra formateado). */
export function formatearPrecioCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Formato de fecha/hora corto para el historial de estados (ADR-006) — locale es-CO. */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}
