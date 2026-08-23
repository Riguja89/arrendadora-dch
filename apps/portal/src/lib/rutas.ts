import type { TipoOperacion } from "@arrendadora/shared";

/**
 * Lógica pura de resolución y construcción de las rutas SEO indexables del catálogo
 * (ADR-010, ADR-018 Decisión 1): `/propiedades/{operacion}/{ciudad}` (catálogo filtrado, CU-001)
 * y `/propiedades/{operacion}/{slug}` (ficha de detalle, CU-002).
 *
 * Next.js no permite dos segmentos dinámicos con nombre distinto en la misma posición de ruta
 * (`[ciudad]` y `[slug]` no pueden coexistir como carpetas separadas bajo `propiedades/[operacion]/`),
 * así que ambas URLs comparten una única ruta física `app/propiedades/[operacion]/[segmento]/page.tsx`
 * que desambigua en servidor con `resolverSegmentoPropiedades()`.
 */

export const OPERACIONES_VALIDAS: readonly TipoOperacion[] = ["arriendo", "venta"];

/** Valida `operacion` contra el enum `TipoOperacion` del contrato (DESIGN-029 línea 230). */
export function esOperacionValida(valor: string | undefined): valor is TipoOperacion {
  return valor === "arriendo" || valor === "venta";
}

/**
 * Normaliza un nombre de ciudad al segmento de URL correspondiente: minúsculas, sin tildes,
 * espacios colapsados a guiones. `listarCiudades()` devuelve nombres con mayúscula inicial
 * (ej. "Yopal") — la URL indexable usa el segmento en minúsculas (ej. `/propiedades/arriendo/yopal`,
 * ADR-018).
 */
export function normalizarSegmentoCiudad(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export interface CiudadDisponible {
  ciudad: string;
}

/**
 * Busca, dentro del catálogo dinámico de ciudades (`listarCiudades()`, GAP-002), la que
 * corresponde al segmento de URL recibido. `undefined` si ninguna coincide — el segmento se
 * interpreta entonces como slug de propiedad.
 */
export function encontrarCiudadPorSegmento<T extends CiudadDisponible>(
  ciudades: readonly T[],
  segmento: string,
): T | undefined {
  const normalizado = normalizarSegmentoCiudad(segmento);
  return ciudades.find((ciudad) => normalizarSegmentoCiudad(ciudad.ciudad) === normalizado);
}

/** `/propiedades/{operacion}/{ciudad}` — ruta canónica indexable del catálogo filtrado (ADR-010/018). */
export function construirHrefCatalogoSegmento(operacion: TipoOperacion, ciudad: string): string {
  return `/propiedades/${operacion}/${normalizarSegmentoCiudad(ciudad)}`;
}

/** `/propiedades/{operacion}/{slug}` — ruta canónica indexable de la ficha de detalle (ADR-010/018). */
export function construirHrefFicha(operacion: TipoOperacion, slug: string): string {
  return `/propiedades/${operacion}/${slug}`;
}

export type ResolucionSegmento =
  | { tipo: "invalido" }
  | { tipo: "catalogo"; operacion: TipoOperacion; ciudad: string }
  | { tipo: "ficha"; operacion: TipoOperacion; slug: string };

/**
 * Desambigua el segundo segmento dinámico de `/propiedades/{operacion}/{segmento}` (ADR-018
 * Decisión 1): `operacion` inválida → `invalido` (404 en el caller). `segmento` que matchea una
 * ciudad conocida → `catalogo` (render CU-001). Cualquier otro valor → `ficha`, tratado como slug
 * de propiedad (render CU-002; el caller resuelve el 404 si el slug no existe).
 *
 * Nota de degradación: si `ciudadesConocidas` viene vacío (ej. `listarCiudades()` falló), ningún
 * segmento matchea como ciudad y todo se interpreta como slug — mismo criterio de degradación
 * graciosa que el resto del catálogo (ver `apps/portal/CLAUDE.md`).
 */
export function resolverSegmentoPropiedades<T extends CiudadDisponible>(
  operacionParam: string,
  segmentoParam: string,
  ciudadesConocidas: readonly T[],
): ResolucionSegmento {
  if (!esOperacionValida(operacionParam)) {
    return { tipo: "invalido" };
  }

  const ciudadMatch = encontrarCiudadPorSegmento(ciudadesConocidas, segmentoParam);
  if (ciudadMatch) {
    return { tipo: "catalogo", operacion: operacionParam, ciudad: ciudadMatch.ciudad };
  }

  return { tipo: "ficha", operacion: operacionParam, slug: segmentoParam };
}
