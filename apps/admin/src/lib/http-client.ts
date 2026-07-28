import type { CodigoError, RespuestaError } from "@arrendadora/shared";

/**
 * Cliente HTTP base hacia la API administrativa — contrato
 * `docs/architecture/contracts/2026-07-03-001-DESIGN-028-openapi-admin-api.yaml`
 * (base path `/v1`: `/auth/login`, `/admin/propiedades`, `/admin/usuarios`, etc.)
 *
 * La sesión es una cookie opaca `sid` (`httpOnly`, `Secure`, `SameSite=Lax` — ADR-004): el SPA
 * nunca la lee ni la envía manualmente, así que **toda** petición va con `credentials: "include"`
 * para que el navegador la adjunte/reciba.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/v1";

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OpcionesPeticion {
  method?: MetodoHttp;
  body?: unknown;
  signal?: AbortSignal;
}

export type RespuestaApi<T> = { ok: true; data: T } | { ok: false; error: RespuestaError };

/**
 * Endpoints públicos del contrato (`security: []`, DESIGN-028) — un 401 en estos paths es parte
 * del flujo normal (ej. credenciales inválidas en `/auth/login`), no una sesión vencida. NO debe
 * disparar el handler global de "sesión expirada" (ver `onUnauthorized`).
 */
const RUTAS_PUBLICAS = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"];

function esRutaPublica(path: string): boolean {
  return RUTAS_PUBLICAS.some((ruta) => path === ruta || path.startsWith(`${ruta}?`));
}

const handlersNoAutenticado = new Set<() => void>();

/**
 * Se suscribe a la señal "sesión inválida o expirada" — un 401 en una ruta protegida (ej. el
 * `sid` venció por el TTL deslizante de 30 min, ADR-004, o la cuenta fue desactivada/bloqueada
 * en otra pestaña). Devuelve la función de desuscripción.
 */
export function onUnauthorized(handler: () => void): () => void {
  handlersNoAutenticado.add(handler);
  return () => handlersNoAutenticado.delete(handler);
}

function notificarNoAutenticado(): void {
  for (const handler of handlersNoAutenticado) handler();
}

function generarCorrelationIdCliente(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function errorDeRed(): RespuestaError {
  return {
    error: "SERVICE_UNAVAILABLE",
    message: "No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.",
    correlation_id: generarCorrelationIdCliente(),
  };
}

function errorGenerico(): RespuestaError {
  return {
    error: "INTERNAL_ERROR" as CodigoError,
    message: "Ocurrió un error inesperado. Intentá de nuevo.",
    correlation_id: generarCorrelationIdCliente(),
  };
}

function esRespuestaError(payload: unknown): payload is RespuestaError {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Partial<RespuestaError>).error === "string" &&
    typeof (payload as Partial<RespuestaError>).message === "string" &&
    typeof (payload as Partial<RespuestaError>).correlation_id === "string"
  );
}

/**
 * Ejecuta una petición contra la API administrativa. Nunca lanza — todo resultado (éxito, error
 * de negocio o error de red) se representa con `RespuestaApi<T>`.
 */
export async function peticionApi<T>(path: string, opciones: OpcionesPeticion = {}): Promise<RespuestaApi<T>> {
  const { method = "GET", body, signal } = opciones;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    return { ok: false, error: errorDeRed() };
  }

  if (respuesta.status === 204) {
    return { ok: true, data: undefined as T };
  }

  let payload: unknown = null;
  try {
    payload = await respuesta.json();
  } catch {
    payload = null;
  }

  if (respuesta.ok) {
    return { ok: true, data: payload as T };
  }

  if (respuesta.status === 401 && !esRutaPublica(path)) {
    notificarNoAutenticado();
  }

  return { ok: false, error: esRespuestaError(payload) ? payload : errorGenerico() };
}
