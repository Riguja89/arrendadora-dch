import { Module } from "@nestjs/common";

/**
 * 3. Panel Admin — Propiedades (ANALYZE-003).
 * Dueño de escritura del aggregate raíz `Propiedad` — CRUD, máquina de estados (RN-012),
 * catálogos (tipos de propiedad, amenidades) e historial de cambios de estado.
 * Consume identidad/RBAC de auth-usuarios (Customer/Supplier, DESIGN-027).
 *
 * Endpoints objetivo (DESIGN-028): /admin/propiedades*, /admin/tipos-propiedad*,
 * /admin/amenidades*, /admin/configuracion.
 *
 * Sin lógica todavía — scaffolding (ver apps/api/CLAUDE.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AdminPropiedadesModule {}
