import { Module } from "@nestjs/common";

/**
 * 2. Portal Público — Detalle y Contacto (ANALYZE-002).
 * Ficha de propiedad (solo lectura) + generación del deep link de WhatsApp.
 * Conformist con el contexto de Configuración (ADR-012, singleton) para el número central
 * y la plantilla de mensaje.
 *
 * Endpoints objetivo (DESIGN-029): GET /public/propiedades/{slug},
 * POST /public/propiedades/{slug}/contacto-whatsapp.
 *
 * Sin lógica todavía — scaffolding (ver apps/api/CLAUDE.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class PortalDetalleModule {}
