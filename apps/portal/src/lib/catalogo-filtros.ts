import type { TipoOperacion } from "@arrendadora/shared";
import { construirHrefCatalogoSegmento, esOperacionValida } from "./rutas";

/**
 * Lógica pura de filtros del catálogo (BUILD-040 §8.3.3):
 * extraída del `manejarEnvio` del `FiltrosCatalogoForm` para poder reusarla
 * desde el `FiltrosMobileDrawer` sin duplicar código y probarla en Vitest sin
 * necesidad de renderizar React (`environment: node`).
 *
 * Cinco filtros oficiales — mantener sincronizado con la spec funcional
 * (RN-024): `operacion, tipo_propiedad, ciudad, precio_min, precio_max`.
 */

/** Valores en bruto de los 5 campos, tal como quedan en el estado del form. */
export interface ValoresFiltrosCatalogo {
  tipoOperacion: string;
  tipoPropiedad: string;
  ciudad: string;
  /** Se guardan como string (input value crudo) — se sanean al construir la ruta. */
  precioMin: string;
  precioMax: string;
}

/** Los mismos valores en formato "iniciales" del server (números parseados). */
export interface ValoresInicialesFiltros {
  tipoOperacion?: TipoOperacion;
  tipoPropiedad?: string;
  ciudad?: string;
  precioMin?: number;
  precioMax?: number;
}

/**
 * Snapshot vacío de los filtros. Útil para reset y como default del drawer
 * mobile antes de la primera apertura.
 */
export const VALORES_FILTROS_VACIOS: ValoresFiltrosCatalogo = {
  tipoOperacion: "",
  tipoPropiedad: "",
  ciudad: "",
  precioMin: "",
  precioMax: "",
};

/** Cuenta cuántos de los 5 campos tienen un valor no vacío. Rango 0..5. */
export function contarFiltrosActivos(
  valores: ValoresFiltrosCatalogo,
): number {
  let total = 0;
  if (valores.tipoOperacion) total += 1;
  if (valores.tipoPropiedad) total += 1;
  if (valores.ciudad) total += 1;
  if (valores.precioMin) total += 1;
  if (valores.precioMax) total += 1;
  return total;
}

/** ¿Al menos un filtro activo? Equivalente a `contar > 0`. */
export function hayFiltrosActivos(valores: ValoresFiltrosCatalogo): boolean {
  return contarFiltrosActivos(valores) > 0;
}

/**
 * Adaptador: convierte los valores iniciales del server (con números y
 * `undefined`) al formato de state del cliente (strings). Se usa al montar el
 * drawer o el form para sincronizar con lo que ya tiene el URL.
 */
export function valoresInicialesAEstado(
  iniciales: ValoresInicialesFiltros,
): ValoresFiltrosCatalogo {
  return {
    tipoOperacion: iniciales.tipoOperacion ?? "",
    tipoPropiedad: iniciales.tipoPropiedad ?? "",
    ciudad: iniciales.ciudad ?? "",
    precioMin: iniciales.precioMin?.toString() ?? "",
    precioMax: iniciales.precioMax?.toString() ?? "",
  };
}

/**
 * Construye la ruta canónica de destino tras un submit de filtros
 * (equivalente al `manejarEnvio` original — ADR-010/ADR-018 Decisión 1):
 * si hay operación + ciudad → `/propiedades/{operacion}/{ciudad}?…`,
 * sino → `/?…`. Los filtros restantes se preservan como query params.
 * NO navega — solo devuelve la URL, para que el caller decida (router.push).
 */
export function construirRutaCatalogo(
  valores: ValoresFiltrosCatalogo,
): string {
  const { tipoOperacion, tipoPropiedad, ciudad, precioMin, precioMax } =
    valores;

  if (esOperacionValida(tipoOperacion) && ciudad) {
    const paramsRestantes = new URLSearchParams();
    if (tipoPropiedad) paramsRestantes.set("tipo_propiedad", tipoPropiedad);
    if (precioMin) paramsRestantes.set("precio_min", precioMin);
    if (precioMax) paramsRestantes.set("precio_max", precioMax);
    const query = paramsRestantes.toString();
    const rutaCanonica = construirHrefCatalogoSegmento(tipoOperacion, ciudad);
    return query ? `${rutaCanonica}?${query}` : rutaCanonica;
  }

  const params = new URLSearchParams();
  if (tipoOperacion) params.set("tipo_operacion", tipoOperacion);
  if (tipoPropiedad) params.set("tipo_propiedad", tipoPropiedad);
  if (ciudad) params.set("ciudad", ciudad);
  if (precioMin) params.set("precio_min", precioMin);
  if (precioMax) params.set("precio_max", precioMax);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
