import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AdminLayout } from "@/routes/AdminLayout";
import { LoginPage } from "@/routes/LoginPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { PropiedadesPage } from "@/routes/PropiedadesPage";
import { UsuariosPage } from "@/routes/UsuariosPage";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";

/**
 * Routing del panel (CU-001, ADR-004, ADR-014):
 * - `/login` es pública.
 * - Todo lo demás vive detrás de `RequireAuth` (sesión) dentro de `AdminLayout`.
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
