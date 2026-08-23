import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AdminLayout } from "@/routes/AdminLayout";
import { LoginPage } from "@/routes/LoginPage";
import { ForgotPasswordPage } from "@/routes/ForgotPasswordPage";
import { ResetPasswordPage } from "@/routes/ResetPasswordPage";
import { CambiarPasswordPage } from "@/routes/CambiarPasswordPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { PropiedadesPage } from "@/routes/PropiedadesPage";
import { PropiedadNuevaPage } from "@/routes/PropiedadNuevaPage";
import { PropiedadEditarPage } from "@/routes/PropiedadEditarPage";
import { UsuariosPage } from "@/routes/UsuariosPage";
import { UsuarioNuevaPage } from "@/routes/UsuarioNuevoPage";
import { UsuarioEditarPage } from "@/routes/UsuarioEditarPage";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";

/**
 * Routing del panel (CU-001, CU-002, ADR-004, ADR-014):
 * - `/login`, `/forgot-password` y `/reset-password` son públicas (CU-002 — recuperación de
 *   contraseña sin sesión).
 * - Todo lo demás vive detrás de `RequireAuth` (sesión) dentro de `AdminLayout`.
 * - `/cambiar-password` (GAP-004) también vive detrás de `RequireAuth`: cubre el cambio
 *   voluntario y el forzado — `RequireAuth` redirige acá automáticamente mientras
 *   `requiereCambioPassword=true`.
 * - `/propiedades/nueva` y `/propiedades/:id/editar` (spec-003 CU-001/CU-002) están disponibles
 *   para los tres roles — el alcance real (propias vs. todas) lo aplica el backend (RN-010/011).
 * - `/usuarios`, `/usuarios/nuevo` y `/usuarios/:id/editar` (spec-005 CU-003/CU-004) además
 *   exigen `RequireRole roles={["administrador"]}` (matriz RBAC ADR-014).
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
              <Route path="/propiedades" element={<PropiedadesPage />} />
              <Route path="/propiedades/nueva" element={<PropiedadNuevaPage />} />
              <Route path="/propiedades/:id/editar" element={<PropiedadEditarPage />} />
              <Route element={<RequireRole roles={["administrador"]} />}>
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/usuarios/nuevo" element={<UsuarioNuevaPage />} />
                <Route path="/usuarios/:id/editar" element={<UsuarioEditarPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
