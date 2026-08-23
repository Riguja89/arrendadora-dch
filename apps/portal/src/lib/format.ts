/**
 * Utilidades de formato puro (sin dependencias de React/Next) — reutilizables desde
 * Server Components y Client Components.
 */

/**
 * Formatea un precio en pesos colombianos según RN-001 (spec-portal-catalogo):
 * signo pesos, espacio y cifra con punto como separador de miles. Ejemplo: `$ 1.500.000`.
 *
 * Implementación manual (sin `Intl.NumberFormat`) para no depender de los datos ICU
 * disponibles en el runtime — garantiza el formato exacto exigido por la regla de negocio.
 */
export function formatearPrecioCOP(precio: number): string {
  const entero = Math.round(precio);
  const signo = entero < 0 ? "-" : "";
  const digitos = Math.abs(entero).toString();
  const conSeparadorMiles = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${signo}$ ${conSeparadorMiles}`;
}

/** Parsea un valor de query string a entero positivo; `undefined` si no es válido. */
export function parseEnteroPositivo(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const numero = Number.parseInt(valor, 10);
  if (!Number.isFinite(numero) || numero < 0) return undefined;
  return numero;
}

/** Parsea el número de página de la query string; `1` por defecto o si el valor no es válido. */
export function parsePagina(valor: string | undefined): number {
  const numero = parseEnteroPositivo(valor);
  return numero && numero >= 1 ? numero : 1;
}
