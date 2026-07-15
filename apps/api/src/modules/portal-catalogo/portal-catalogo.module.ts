import { Module } from "@nestjs/common";

/**
 * 1. Portal Público — Catálogo (ANALYZE-001).
 * Listado, búsqueda y filtros públicos de propiedades (solo lectura).
 * Consume el shared kernel `Propiedad` (solo lectura) de admin-propiedades (ADR-001, DESIGN-027).
 *
 * Endpoints objetivo (DESIGN-029): GET /public/propiedades, GET /public/destacadas,
 * GET /public/tipos-propiedad, GET /public/ciudades.
 *
 * Sin lógica todavía — scaffolding (ver apps/api/CLAUDE.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class PortalCatalogoModule {}
