import type { RespuestaError, RespuestaPaginada } from "@arrendadora/shared";

/**
 * Cliente HTTP base hacia la API pública del portal — contrato
 * `docs/architecture/contracts/2026-07-03-001-DESIGN-029-openapi-portal-api.yaml`
 * (base path `/v1`: `/public/propiedades`, `/public/destacadas`, `/public/tipos-propiedad`,
 * `/public/ciudades`, `/public/propiedades/{slug}`, `/public/propiedades/{slug}/contacto-whatsapp`).
 *
 * Esqueleto de scaffolding — SIN llamadas `fetch` reales todavía. El objetivo es fijar el tipo
 * de retorno (`RespuestaApi<T>`) para que las páginas SSR y hooks futuros puedan tipar contra
 * él desde ya. Se implementa spec por spec a partir de CU-001 (spec-002).
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

export interface OpcionesPeticion {
  signal?: AbortSignal;
}

export type RespuestaApi<T> = { ok: true; data: T } | { ok: false; error: RespuestaError };

/**
 * Placeholder de bajo nivel. Lanza a propósito — ningún consumidor debe depender de un
 * resultado real todavía; el error deja explícito que la implementación está pendiente.
 */
export async function peticionApi<T>(
  path: string,
  _opciones: OpcionesPeticion = {},
): Promise<RespuestaApi<T>> {
  throw new Error(
    `peticionApi("${path}") no implementado — scaffolding sin lógica de negocio (CU-001 pendiente, spec-002).`,
  );
}

export type { RespuestaPaginada };
