import { Navigate, Outlet } from "react-router-dom";
import type { RolUsuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import { tieneRolPermitido } from "@/lib/permissions";

interface RequireRoleProps {
  roles: readonly RolUsuario[];
}

/**
 * Guard de routing RBAC (ADR-014) — oculta rutas restringidas por rol. Se asume anidado dentro
 * de `RequireAuth` (siempre hay sesión al llegar acá); si el rol actual no está autorizado,
 * redirige a `/dashboard` en lugar de mostrar la ruta.
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const { rol } = useAuth();

  if (!tieneRolPermitido(rol, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
