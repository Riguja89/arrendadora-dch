import { useAuth } from "@/lib/auth-context";

/**
 * Placeholder de dashboard — sin datos reales todavía (pendiente de incremento de propiedades).
 * Muestra el aviso de contraseña temporal (GAP-004 opción A) cuando aplica; el flujo de cambio
 * de contraseña propio (`POST /auth/change-password`) queda para un incremento posterior.
 */
export function DashboardPage() {
  const { usuario, requiereCambioPassword } = useAuth();

  return (
    <section>
      <h2>Dashboard</h2>
      {requiereCambioPassword ? (
        <p className="admin-layout__aviso" role="status">
          Tu cuenta tiene una contraseña temporal asignada por el Administrador. El cambio de
          contraseña estará disponible en un próximo incremento del panel.
        </p>
      ) : null}
      <p>Hola, {usuario?.nombre ?? ""}. Resumen operativo del panel — pendiente de implementar.</p>
    </section>
  );
}
