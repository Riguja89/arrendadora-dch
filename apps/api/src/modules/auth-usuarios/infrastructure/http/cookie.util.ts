/** Nombre de la cookie de sesión opaca (ADR-004, contrato `cookieAuth`). */
export const COOKIE_SESION = "sid";

/**
 * Parseo mínimo del header `Cookie` — evita agregar la dependencia `cookie-parser` solo para
 * leer un único valor. Sin librerías externas: separa por `;`, toma el primer `=` de cada par.
 */
export function parsearCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, parte) => {
    const separador = parte.indexOf("=");
    if (separador === -1) return acc;
    const nombre = parte.slice(0, separador).trim();
    const valor = parte.slice(separador + 1).trim();
    if (nombre) acc[nombre] = decodeURIComponent(valor);
    return acc;
  }, {});
}
