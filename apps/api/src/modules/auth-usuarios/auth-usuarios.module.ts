import { Module } from "@nestjs/common";

/**
 * 5. Autenticación y Usuarios (ANALYZE-005).
 * Identidad, RBAC (administrador/agente/editor), sesiones server-side (ADR-004) y ciclo de
 * vida de usuarios. Upstream (Customer/Supplier) de admin-propiedades y admin-multimedia
 * (DESIGN-027).
 *
 * Endpoints objetivo (DESIGN-028): /auth/login, /auth/logout, /auth/forgot-password,
 * /auth/reset-password, /auth/change-password, /admin/usuarios*.
 *
 * Sin lógica todavía — scaffolding (ver apps/api/CLAUDE.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AuthUsuariosModule {}
