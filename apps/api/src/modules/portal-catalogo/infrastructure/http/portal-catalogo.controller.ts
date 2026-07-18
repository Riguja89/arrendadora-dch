import { Controller, Get, Query } from "@nestjs/common";
import { BuscarCatalogoUseCase } from "../../application/use-cases/buscar-catalogo.use-case";
import { ListarDestacadasUseCase } from "../../application/use-cases/listar-destacadas.use-case";
import { ListarTiposPropiedadUseCase } from "../../application/use-cases/listar-tipos-propiedad.use-case";
import { ListarCiudadesUseCase } from "../../application/use-cases/listar-ciudades.use-case";
import { BuscarCatalogoQueryDto } from "./dto/buscar-catalogo-query.dto";
import {
  aBusquedaCatalogoWire,
  aCiudadConteoWire,
  aPropiedadResumenWire,
  aTipoPropiedadPublicoWire,
  type BusquedaCatalogoWire,
  type CiudadConteoWire,
  type PropiedadResumenWire,
  type TipoPropiedadPublicoWire,
} from "./mappers/catalogo.mapper";

/**
 * Cara pública del catálogo (ANALYZE-001, contrato DESIGN-029). Endpoints ANÓNIMOS — NO llevan
 * `SessionAuthGuard`/`RolesGuard`: el catálogo es público por diseño. El envelope de error y el
 * `correlation_id` los aplican el `AllExceptionsFilter` y el `CorrelationIdMiddleware` globales
 * (ADR-015, DEI-003). El prefijo `/v1` lo pone el bootstrap (`setGlobalPrefix`).
 *
 * Alcance de este BC: búsqueda + filtros + paginación + destacadas + catálogos de filtro. La ficha
 * de detalle (`/public/propiedades/{slug}`) y el deep link de WhatsApp viven en `portal-detalle`.
 */
@Controller("public")
export class PortalCatalogoController {
  constructor(
    private readonly buscarCatalogoUseCase: BuscarCatalogoUseCase,
    private readonly listarDestacadasUseCase: ListarDestacadasUseCase,
    private readonly listarTiposPropiedadUseCase: ListarTiposPropiedadUseCase,
    private readonly listarCiudadesUseCase: ListarCiudadesUseCase,
  ) {}

  /** CU-001/CU-002 (HU-001, HU-002) — búsqueda paginada con filtros acumulativos (RN-024). */
  @Get("propiedades")
  async buscar(@Query() query: BuscarCatalogoQueryDto): Promise<BusquedaCatalogoWire> {
    const resultado = await this.buscarCatalogoUseCase.ejecutar({
      tipoOperacion: query.tipo_operacion,
      tipoPropiedad: query.tipo_propiedad,
      ciudad: query.ciudad,
      barrio: query.barrio,
      q: query.q,
      precioMin: query.precio_min,
      precioMax: query.precio_max,
      pagina: query.pagina,
      tamanoPagina: query.tamano_pagina,
    });
    return aBusquedaCatalogoWire(
      resultado.items,
      resultado.total,
      resultado.pagina,
      resultado.tamanoPagina,
    );
  }

  /** CU-003 (HU-003) — hasta 6 propiedades destacadas del home, con fallback (RN-023). */
  @Get("destacadas")
  async destacadas(): Promise<PropiedadResumenWire[]> {
    const tarjetas = await this.listarDestacadasUseCase.ejecutar();
    return tarjetas.map(aPropiedadResumenWire);
  }

  /** Tipos de propiedad activos para poblar el filtro (ADR-005). */
  @Get("tipos-propiedad")
  async tiposPropiedad(): Promise<TipoPropiedadPublicoWire[]> {
    const tipos = await this.listarTiposPropiedadUseCase.ejecutar();
    return tipos.map(aTipoPropiedadPublicoWire);
  }

  /** Ciudades con al menos una propiedad visible, para poblar el filtro (GAP-002). */
  @Get("ciudades")
  async ciudades(): Promise<CiudadConteoWire[]> {
    const ciudades = await this.listarCiudadesUseCase.ejecutar();
    return ciudades.map(aCiudadConteoWire);
  }
}
