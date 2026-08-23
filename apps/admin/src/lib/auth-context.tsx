import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { RespuestaError, RolUsuario, SesionUsuario, Usuario } from "@arrendadora/shared";
import { onUnauthorized, peticionApi } from "./http-client";
import { guardarSesionCache, leerSesionCache, limpiarSesionCache } from "./session-storage";

/**
 * Estado de sesión del panel (CU-001, ADR-004). La cookie `sid` (httpOnly) es la fuente de
 * verdad server-side; este contexto es la proyección en memoria que consume la UI (React
 * Router guards, nav de `AdminLayout`, RBAC de `permissions.ts`).
 *
 * Rehidratación en refresh: como el contrato no expone un endpoint de sesión/`me`
 * (ver `session-storage.ts`), el estado inicial se optimiza leyendo la cache no sensible de
 * `sessionStorage`. Si el `sid` ya expiró, la primera petición autenticada devuelve 401 y
 * `onUnauthorized()` limpia el estado y redirige a `/login` (vía `RequireAuth`).
 */

export interface ResultadoLogin {
  ok: boolean;
  error?: RespuestaError;
  requiereCambioPassword?: boolean;
}

interface AuthContextValue {
  usuario: Usuario | null;
  rol: RolUsuario | null;
  autenticado: boolean;
  requiereCambioPassword: boolean;
  login: (email: string, password: string) => Promise<ResultadoLogin>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerSesionCache());
  const [requiereCambioPassword, setRequiereCambioPassword] = useState<boolean>(
    () => leerSesionCache()?.requiere_cambio_password ?? false,
  );

  useEffect(() => {
    return onUnauthorized(() => {
      limpiarSesionCache();
      setUsuario(null);
      setRequiereCambioPassword(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ResultadoLogin> => {
    const respuesta = await peticionApi<SesionUsuario>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!respuesta.ok) {
      return { ok: false, error: respuesta.error };
    }

    guardarSesionCache(respuesta.data.usuario);
    setUsuario(respuesta.data.usuario);
    setRequiereCambioPassword(respuesta.data.requiere_cambio_password);
    return { ok: true, requiereCambioPassword: respuesta.data.requiere_cambio_password };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    // El fallo de red no debe impedir el logout local — la cookie httpOnly de todas formas
    // vence sola (TTL deslizante de 30 min, ADR-004); lo importante es limpiar el cliente ya.
    await peticionApi("/auth/logout", { method: "POST" });
    limpiarSesionCache();
    setUsuario(null);
    setRequiereCambioPassword(false);
  }, []);

  const value: AuthContextValue = {
    usuario,
    rol: usuario?.rol ?? null,
    autenticado: usuario !== null,
    requiereCambioPassword,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth() debe usarse dentro de <AuthProvider>.");
  }
  return contexto;
}
