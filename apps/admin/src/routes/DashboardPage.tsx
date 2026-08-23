import { useAuth } from "@/lib/auth-context";

/**
 * Placeholder de dashboard — sin datos reales todavía (pendiente de incremento de propiedades).
 * El aviso de contraseña temporal (GAP-004) ya no vive acá: `RequireAuth` intercepta la
 * navegación mientras `requiereCambioPassword=true` y redirige a `/cambiar-password` antes de
 * que esta pantalla llegue a renderizar.
 */
export function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <section>
      <h2>Dashboard</h2>
      <p>Hola, {usuario?.nombre ?? ""}. Resumen operativo del panel — pendiente de implementar.</p>
    </section>
  );
}
