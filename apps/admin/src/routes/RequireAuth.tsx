import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

const RUTA_CAMBIO_PASSWORD = "/cambiar-password";

/**
 * Guard de routing (CU-001) — sin sesión autenticada, redirige a `/login` conservando la ruta de
 * origen para volver ahí tras el login. Envuelve todas las rutas de `AdminLayout`.
 *
 * Cambio forzado (GAP-004): si la sesión trae `requiereCambioPassword=true` (alta con
 * contraseña temporal sin cambiar), intercepta la navegación a cualquier otra ruta autenticada y
 * redirige a `/cambiar-password` hasta que el usuario la cambie.
 */
export function RequireAuth() {
  const { autenticado, requiereCambioPassword } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiereCambioPassword && location.pathname !== RUTA_CAMBIO_PASSWORD) {
    return <Navigate to={RUTA_CAMBIO_PASSWORD} replace />;
  }

  return <Outlet />;
}
