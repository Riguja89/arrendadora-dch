import type { Usuario } from "@arrendadora/shared";

/**
 * Cache liviana y NO sensible de la sesión en `sessionStorage`, usada solo para rehidratar el
 * estado de UI (usuario, rol) cuando el usuario refresca la página.
 *
 * Limitación conocida y documentada: el contrato admin
 * (`docs/architecture/contracts/2026-07-03-001-DESIGN-028-openapi-admin-api.yaml`) no expone un
 * endpoint de sesión/`me` para validar la cookie `sid` (httpOnly, ADR-004) desde el cliente. Esta
 * cache es una optimización de UX (evita un parpadeo a `/login` en cada F5) — la fuente de verdad
 * de la autenticación sigue siendo la cookie `sid` server-side: si expiró o fue revocada, la
 * primera petición autenticada responde 401 y `onUnauthorized()` (`http-client.ts`) limpia esta
 * cache y cierra la sesión en el cliente.
 *
 * Nunca persiste contraseñas, tokens ni la cookie de sesión — solo el shape público de `Usuario`
 * tal como lo devuelve `POST /auth/login`.
 */
const CLAVE_CACHE_SESION = "arrendadora_admin_sesion";

function storageDisponible(): boolean {
  return typeof sessionStorage !== "undefined";
}

function esUsuarioValido(valor: unknown): valor is Usuario {
  if (typeof valor !== "object" || valor === null) return false;
  const candidato = valor as Partial<Usuario>;
  return (
    typeof candidato.id === "string" &&
    typeof candidato.email === "string" &&
    typeof candidato.nombre === "string" &&
    typeof candidato.rol === "string" &&
    typeof candidato.estado === "string"
  );
}

/** Persiste el `Usuario` devuelto por `/auth/login` para rehidratar el estado de UI tras un refresh. */
export function guardarSesionCache(usuario: Usuario): void {
  if (!storageDisponible()) return;
  try {
    sessionStorage.setItem(CLAVE_CACHE_SESION, JSON.stringify(usuario));
  } catch {
    // sessionStorage no disponible (modo privado, cuota agotada, etc.) — degrada sin romper el login.
  }
}

/** Lee la cache de sesión. Retorna `null` si no existe, está corrupta o no tiene el shape esperado. */
export function leerSesionCache(): Usuario | null {
  if (!storageDisponible()) return null;
  try {
    const crudo = sessionStorage.getItem(CLAVE_CACHE_SESION);
    if (!crudo) return null;
    const parseado: unknown = JSON.parse(crudo);
    return esUsuarioValido(parseado) ? parseado : null;
  } catch {
    return null;
  }
}

/** Limpia la cache de sesión — se invoca en logout y ante un 401 de sesión vencida. */
export function limpiarSesionCache(): void {
  if (!storageDisponible()) return;
  try {
    sessionStorage.removeItem(CLAVE_CACHE_SESION);
  } catch {
    // no-op — nada que limpiar si sessionStorage falla al remover.
  }
}
