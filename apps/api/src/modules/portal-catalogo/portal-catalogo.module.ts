import { Module } from "@nestjs/common";
import { AdminMultimediaModule } from "../admin-multimedia/admin-multimedia.module";
import { ConfiguracionModule } from "../configuracion/configuracion.module";

import { PROPIEDAD_CATALOGO_REPOSITORY } from "./domain/ports/propiedad-catalogo.repository.port";
import { PropiedadCatalogoPrismaRepository } from "./infrastructure/persistence/propiedad-catalogo-prisma.repository";

import { EnriquecedorPortadasService } from "./application/services/enriquecedor-portadas.service";
import { BuscarCatalogoUseCase } from "./application/use-cases/buscar-catalogo.use-case";
import { ListarDestacadasUseCase } from "./application/use-cases/listar-destacadas.use-case";
import { ListarTiposPropiedadUseCase } from "./application/use-cases/listar-tipos-propiedad.use-case";
import { ListarCiudadesUseCase } from "./application/use-cases/listar-ciudades.use-case";

import { PortalCatalogoController } from "./infrastructure/http/portal-catalogo.controller";

/**
 * 1. Portal Público — Catálogo (ANALYZE-001, contrato DESIGN-029). Cara pública SIN autenticación:
 * búsqueda, filtros, paginación (RN-024), destacadas (RN-023) y catálogos de filtro. Solo lectura —
 * consume `Propiedad` como shared kernel de solo lectura de `admin-propiedades` (ADR-001, DESIGN-027).
 *
 * Endpoints (DESIGN-029): GET /public/propiedades, /public/destacadas, /public/tipos-propiedad,
 * /public/ciudades. La ficha de detalle y el WhatsApp viven en `portal-detalle` (ANALYZE-002).
 *
 * Acoplamientos cross-BC (in-process, DESIGN-027):
 * - Importa `AdminMultimediaModule` para consumir `MULTIMEDIA_QUERY` (foto de portada, RN-014).
 * - Importa `ConfiguracionModule` para consumir `CONFIGURACION_QUERY` (imagen genérica de fallback, RN-014).
 * - Lee la tabla `propiedades` directamente vía `PropiedadCatalogoPrismaRepository` (desviación
 *   CORE-006 acotada a lectura — `admin-propiedades` aún no expone query-port público, ver CLAUDE.md).
 */
@Module({
  imports: [AdminMultimediaModule, ConfiguracionModule],
  controllers: [PortalCatalogoController],
  providers: [
    // Puerto → adaptador de infraestructura (solo lectura)
    { provide: PROPIEDAD_CATALOGO_REPOSITORY, useClass: PropiedadCatalogoPrismaRepository },

    // Servicio de aplicación transversal (resolución de portadas cross-BC)
    EnriquecedorPortadasService,

    // Casos de uso (aplicación)
    BuscarCatalogoUseCase,
    ListarDestacadasUseCase,
    ListarTiposPropiedadUseCase,
    ListarCiudadesUseCase,
  ],
})
export class PortalCatalogoModule {}
