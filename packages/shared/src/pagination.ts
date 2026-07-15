/**
 * Contrato de paginación API-wide (ADR-015).
 *
 * Parámetros de query: `pagina` (default 1) y `tamano_pagina` (default 20, máximo 100).
 * Toda respuesta paginada expone el bloque `meta` junto al array `data`.
 */

export const PAGINACION_DEFAULT = {
  pagina: 1,
  tamanoPagina: 20,
  tamanoPaginaMaximo: 100,
} as const;

export interface ParametrosPaginacion {
  pagina: number;
  tamanoPagina: number;
}

export interface MetaPaginacion {
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: MetaPaginacion;
}

/** Calcula el bloque `meta` a partir del total de registros y los parámetros de paginación. */
export function construirMetaPaginacion(
  total: number,
  parametros: ParametrosPaginacion,
): MetaPaginacion {
  const totalPaginas = Math.max(1, Math.ceil(total / parametros.tamanoPagina));
  return {
    total,
    pagina: parametros.pagina,
    tamanoPagina: parametros.tamanoPagina,
    totalPaginas,
  };
}
