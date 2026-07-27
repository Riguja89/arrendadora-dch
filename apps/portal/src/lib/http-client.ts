import type { RespuestaError } from "@arrendadora/shared";

/**
 * Cliente HTTP base hacia la API pública del portal — contrato
 * `docs/architecture/contracts/2026-07-03-001-DESIGN-029-openapi-portal-api.yaml`
 * (base path `/v1`: `/public/propiedades`, `/public/destacadas`, `/public/tipos-propiedad`,
 * `/public/ciudades`, `/public/propiedades/{slug}`, `/public/propiedades/{slug}/contacto-whatsapp`).
 *
 * `peticionApi()` corre tanto en Server Components (SSR/Node) como en el navegador — usa `fetch`
 * global (disponible nativamente en ambos entornos, sin polyfill). Por default no cachea
 * (`cache: "no-store"`) para reflejar el inventario real (propiedades cambian de estado con
 * frecuencia) — el arquitecto puede afinar a ISR/`revalidate` por endpoint más adelante.
 *
 * Nota: no se reexporta `RespuestaPaginada` de `@arrendadora/shared` — esa forma (`{ data, meta }`)
 * corresponde al envelope anidado del admin (ADR-015). El endpoint público `/public/propiedades`
 * declara un bloque de paginación PLANO (`pagina`, `tamano_pagina`, `total`, `total_paginas` junto
 * a `data[]`, ver DESIGN-029) — desviación documentada en `apps/api/.../portal-catalogo/CLAUDE.md`.
 * Los tipos de esa forma plana viven en `src/lib/api/catalogo.ts`, junto al resto del wire del BC.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export interface OpcionesPeticion {
  signal?: AbortSignal;
  /** Override puntual de estrategia de cache de Next/fetch. Default: `"no-store"`. */
  cache?: RequestCache;
}

export type RespuestaApi<T> = { ok: true; data: T } | { ok: false; error: RespuestaError };

function generarCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Construye un `RespuestaError` a partir del body de una respuesta no-2xx (envelope ADR-015). */
async function leerError(response: Response): Promise<RespuestaError> {
  try {
    const cuerpo = (await response.json()) as Partial<RespuestaError> | null;
    if (cuerpo && typeof cuerpo.error === "string" && typeof cuerpo.message === "string") {
      return {
        error: cuerpo.error as RespuestaError["error"],
        message: cuerpo.message,
        correlation_id: cuerpo.correlation_id ?? generarCorrelationId(),
        ...(cuerpo.detalles ? { detalles: cuerpo.detalles } : {}),
      };
    }
  } catch {
    // El body no es JSON válido (o está vacío) — se sintetiza el error genérico de abajo.
  }
  return {
    error: "INTERNAL_ERROR",
    message: "Ocurrió un error inesperado al consultar el servicio.",
    correlation_id: generarCorrelationId(),
  };
}

/**
 * Petición GET tipada contra la API pública. Nunca lanza: los errores de red, HTTP y de
 * parseo se normalizan al envelope `RespuestaError` (ADR-015) dentro de `{ ok: false, error }`.
 */
export async function peticionApi<T>(
  path: string,
  opciones: OpcionesPeticion = {},
): Promise<RespuestaApi<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      signal: opciones.signal,
      cache: opciones.cache ?? "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { ok: false, error: await leerError(response) };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: {
        error: "SERVICE_UNAVAILABLE",
        message: "No pudimos conectar con el servicio de propiedades. Intentá de nuevo en unos minutos.",
        correlation_id: generarCorrelationId(),
      },
    };
  }
}
