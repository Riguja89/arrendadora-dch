import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/**
 * Guard de routing (CU-001) — sin sesión autenticada, redirige a `/login` conservando la ruta de
 * origen para volver ahí tras el login. Envuelve todas las rutas de `AdminLayout`.
 */
export function RequireAuth() {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
