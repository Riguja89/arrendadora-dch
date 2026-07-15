import { Link, Outlet } from "react-router-dom";

/**
 * Layout placeholder de la sección autenticada — SIN verificación de sesión real todavía
 * (auth-usuarios pendiente de Construir). Envuelve dashboard/propiedades con una barra de
 * navegación mínima.
 */
export function AdminLayout() {
  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <strong>Arrendadora — Panel admin</strong>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/propiedades">Propiedades</Link>
        </nav>
      </header>
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
