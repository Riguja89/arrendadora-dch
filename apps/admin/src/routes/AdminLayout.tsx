import { Link, Outlet, useNavigate } from "react-router-dom";
import type { RolUsuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import { puedeGestionarUsuarios } from "@/lib/permissions";

const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  administrador: "Administrador",
  agente: "Agente",
  editor: "Editor",
};

/**
 * Layout de la sección autenticada (`RequireAuth` la envuelve — siempre hay sesión acá).
 * El nav refleja el rol de la sesión (ADR-014: solo Administrador ve "Usuarios") y expone el
 * cierre de sesión (CU-001 / `/auth/logout`, ADR-004).
 */
export function AdminLayout() {
  const { usuario, rol, logout } = useAuth();
  const navigate = useNavigate();

  async function manejarLogout(): Promise<void> {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <strong>Arrendadora — Panel admin</strong>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/propiedades">Propiedades</Link>
          {puedeGestionarUsuarios(rol) ? <Link to="/usuarios">Usuarios</Link> : null}
        </nav>
        <div className="admin-layout__usuario">
          {usuario ? (
            <span>
              {usuario.nombre} · <span className="admin-layout__rol">{rol ? ETIQUETAS_ROL[rol] : ""}</span>
            </span>
          ) : null}
          <button type="button" onClick={() => void manejarLogout()}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
