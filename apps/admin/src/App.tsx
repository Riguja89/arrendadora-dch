import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AdminLayout } from "@/routes/AdminLayout";
import { LoginPage } from "@/routes/LoginPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { PropiedadesPage } from "@/routes/PropiedadesPage";
import { PropiedadNuevaPage } from "@/routes/PropiedadNuevaPage";
import { PropiedadEditarPage } from "@/routes/PropiedadEditarPage";
import { UsuariosPage } from "@/routes/UsuariosPage";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";

/**
 * Routing del panel (CU-001, ADR-004, ADR-014):
 * - `/login` es pública.
 * - Todo lo demás vive detrás de `RequireAuth` (sesión) dentro de `AdminLayout`.
 * - `/propiedades/nueva` y `/propiedades/:id/editar` (spec-003 CU-001/CU-002) están disponibles
 *   para los tres roles — el alcance real (propias vs. todas) lo aplica el backend (RN-010/011).
 * - `/usuarios` además exige `RequireRole roles={["administrador"]}` (matriz RBAC ADR-014).
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/propiedades" element={<PropiedadesPage />} />
              <Route path="/propiedades/nueva" element={<PropiedadNuevaPage />} />
              <Route path="/propiedades/:id/editar" element={<PropiedadEditarPage />} />
              <Route element={<RequireRole roles={["administrador"]} />}>
                <Route path="/usuarios" element={<UsuariosPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
