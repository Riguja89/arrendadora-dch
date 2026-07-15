import { Module } from "@nestjs/common";

/**
 * 4. Panel Admin — Multimedia y Geolocalización (ANALYZE-004).
 * Fotos, portada y ubicación como composición del aggregate `Propiedad` (Partnership con
 * admin-propiedades, DESIGN-027). Binarios en S3/CloudFront (ADR-008); la BD solo persiste
 * metadatos y claves S3.
 *
 * Endpoints objetivo (DESIGN-028): /admin/propiedades/{id}/fotos*, /admin/propiedades/{id}/ubicacion.
 *
 * Sin lógica todavía — scaffolding (ver apps/api/CLAUDE.md).
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AdminMultimediaModule {}
