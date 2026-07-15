import type { RespuestaError } from "@arrendadora/shared";

/**
 * Cliente HTTP base hacia la API administrativa — contrato
 * `docs/architecture/contracts/2026-07-03-001-DESIGN-028-openapi-admin-api.yaml`
 * (base path `/v1`: `/auth/login`, `/admin/propiedades`, `/admin/usuarios`, etc.)
 *
 * Esqueleto de scaffolding — SIN llamadas `fetch` reales ni manejo de sesión todavía. Se
 * implementa junto con `auth-usuarios` (bounded context de `apps/api`) en la siguiente
 * iteración de Construir.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/v1";

export interface OpcionesPeticion {
  signal?: AbortSignal;
}

export type RespuestaApi<T> = { ok: true; data: T } | { ok: false; error: RespuestaError };

/**
 * Placeholder de bajo nivel. Lanza a propósito — ningún consumidor debe depender de un
 * resultado real todavía.
 */
export async function peticionApi<T>(
  path: string,
  _opciones: OpcionesPeticion = {},
): Promise<RespuestaApi<T>> {
  throw new Error(
    `peticionApi("${path}") no implementado — scaffolding sin lógica de negocio (auth-usuarios pendiente).`,
  );
}
