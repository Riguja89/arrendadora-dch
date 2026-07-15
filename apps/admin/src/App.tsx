import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/routes/AdminLayout";
import { LoginPage } from "@/routes/LoginPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { PropiedadesPage } from "@/routes/PropiedadesPage";

/**
 * Routing base del panel — placeholder de scaffolding, SIN guard de autenticación real
 * todavía (auth-usuarios, `apps/api/src/modules/auth-usuarios`, pendiente de Construir).
 * `AdminLayout` representa la sección "autenticada" solo como estructura visual.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/propiedades" element={<PropiedadesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
