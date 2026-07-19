import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CrearPropiedadUseCase } from "../../application/use-cases/crear-propiedad.use-case";
import { EditarPropiedadUseCase } from "../../application/use-cases/editar-propiedad.use-case";
import { ListarPropiedadesUseCase } from "../../application/use-cases/listar-propiedades.use-case";
import { ObtenerPropiedadUseCase } from "../../application/use-cases/obtener-propiedad.use-case";
import { CambiarEstadoPropiedadUseCase } from "../../application/use-cases/cambiar-estado-propiedad.use-case";
import { DuplicarPropiedadUseCase } from "../../application/use-cases/duplicar-propiedad.use-case";
import { ArchivarPropiedadUseCase } from "../../application/use-cases/archivar-propiedad.use-case";
import { RestaurarPropiedadUseCase } from "../../application/use-cases/restaurar-propiedad.use-case";
import { ListarHistorialUseCase } from "../../application/use-cases/listar-historial.use-case";
import type { Actor } from "../../domain/types/rol-actor";
import { CrearPropiedadDto } from "./dto/crear-propiedad.dto";
import { EditarPropiedadDto } from "./dto/editar-propiedad.dto";
import { ListarPropiedadesQueryDto } from "./dto/listar-propiedades-query.dto";
import { CambiarEstadoPropiedadDto } from "./dto/cambiar-estado-propiedad.dto";
import {
  aHistorialWire,
  aPaginacionWire,
  aPropiedadWire,
  type HistorialEstadoWire,
  type PaginacionMetaWire,
  type PropiedadWire,
} from "./mappers/propiedad.mapper";
import { SessionAuthGuard } from "../../../auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../../../auth-usuarios/infrastructure/http/guards/roles.guard";
import { Roles } from "../../../auth-usuarios/infrastructure/http/decorators/roles.decorator";
import { UsuarioActual } from "../../../auth-usuarios/infrastructure/http/decorators/usuario-actual.decorator";
import type { Usuario } from "../../../auth-usuarios/domain/entities/usuario.entity";

/** Traduce el `Usuario` autenticado (auth-usuarios, upstream) al `Actor` puro del dominio propio. */
function aActor(usuario: Usuario): Actor {
  return { id: usuario.id, rol: usuario.rol };
}

/**
 * CRUD del aggregate raíz `Propiedad` (ANALYZE-003, contrato DESIGN-028). Todos los endpoints
 * exigen sesión activa (`SessionAuthGuard`) + RBAC por handler (`RolesGuard`, ADR-014). El alcance
 * fino por propiedad (Agente solo las propias — RN-010/RN-011) lo aplica cada caso de uso vía
 * `puedeOperarSobrePropiedad`; el `@Roles` del handler solo abre la compuerta a los roles válidos.
 */
@Controller("admin/propiedades")
@UseGuards(SessionAuthGuard, RolesGuard)
export class PropiedadesController {
  constructor(
    private readonly crearPropiedadUseCase: CrearPropiedadUseCase,
    private readonly editarPropiedadUseCase: EditarPropiedadUseCase,
    private readonly listarPropiedadesUseCase: ListarPropiedadesUseCase,
    private readonly obtenerPropiedadUseCase: ObtenerPropiedadUseCase,
    private readonly cambiarEstadoPropiedadUseCase: CambiarEstadoPropiedadUseCase,
    private readonly duplicarPropiedadUseCase: DuplicarPropiedadUseCase,
    private readonly archivarPropiedadUseCase: ArchivarPropiedadUseCase,
    private readonly restaurarPropiedadUseCase: RestaurarPropiedadUseCase,
    private readonly listarHistorialUseCase: ListarHistorialUseCase,
  ) {}

  /** CU-005 (HU-004) — listado interno paginado con filtros y búsqueda. Cualquier rol autenticado. */
  @Get()
  @Roles("administrador", "agente", "editor")
  async listar(
    @Query() query: ListarPropiedadesQueryDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<{ data: PropiedadWire[]; meta: PaginacionMetaWire }> {
    const { items, total } = await this.listarPropiedadesUseCase.ejecutar({
      actor: aActor(usuario),
      estado: query.estado,
      tipoOperacion: query.tipo_operacion,
      tipoPropiedadId: query.tipo_propiedad,
      agente: query.agente,
      archivada: query.archivada,
      q: query.q,
      pagina: query.pagina,
      tamanoPagina: query.tamano_pagina,
    });
    return {
      // Envuelto en arrow: `Array.map` pasa el índice como 2º argumento y `aPropiedadWire`
      // interpretaría ese número como `fotos`. El listado no puebla `fotos[]` (evita N+1).
      data: items.map((propiedad) => aPropiedadWire(propiedad)),
      meta: aPaginacionWire(total, query.pagina, query.tamano_pagina),
    };
  }

  /** CU-001 (HU-001) — crear propiedad. El Agente queda autoasignado (RN-010). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles("administrador", "agente", "editor")
  async crear(@Body() dto: CrearPropiedadDto, @UsuarioActual() usuario: Usuario): Promise<PropiedadWire> {
    const propiedad = await this.crearPropiedadUseCase.ejecutar({
      actor: aActor(usuario),
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipoOperacion: dto.tipo_operacion,
      tipoPropiedadId: dto.tipo_propiedad_id,
      ciudad: dto.ciudad,
      barrio: dto.barrio,
      direccion: dto.direccion ?? null,
      precio: dto.precio,
      area: dto.area,
      habitaciones: dto.habitaciones,
      banos: dto.banos,
      estrato: dto.estrato ?? null,
      parqueaderos: dto.parqueaderos ?? null,
      destacada: dto.destacada ?? false,
      agenteId: dto.agente_id ?? null,
      amenidades: (dto.amenidades ?? []).map((a) => ({ amenidadId: a.amenidad_id, cantidad: a.cantidad })),
    });
    return aPropiedadWire(propiedad);
  }

  /** CU-002 — detalle de una propiedad. Agente solo las propias (RN-010). */
  @Get(":id")
  @Roles("administrador", "agente", "editor")
  async obtener(@Param("id") id: string, @UsuarioActual() usuario: Usuario): Promise<PropiedadWire> {
    const { propiedad, fotos } = await this.obtenerPropiedadUseCase.ejecutar({ actor: aActor(usuario), id });
    return aPropiedadWire(propiedad, fotos);
  }

  /** CU-002 — editar datos (no cambia el estado). Agente solo las propias (RN-010). */
  @Put(":id")
  @Roles("administrador", "agente", "editor")
  async editar(
    @Param("id") id: string,
    @Body() dto: EditarPropiedadDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<PropiedadWire> {
    const propiedad = await this.editarPropiedadUseCase.ejecutar({
      actor: aActor(usuario),
      id,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipoOperacion: dto.tipo_operacion,
      tipoPropiedadId: dto.tipo_propiedad_id,
      ciudad: dto.ciudad,
      barrio: dto.barrio,
      direccion: dto.direccion ?? null,
      precio: dto.precio,
      area: dto.area,
      habitaciones: dto.habitaciones,
      banos: dto.banos,
      estrato: dto.estrato ?? null,
      parqueaderos: dto.parqueaderos ?? null,
      destacada: dto.destacada ?? false,
      agenteId: dto.agente_id ?? null,
      amenidades: (dto.amenidades ?? []).map((a) => ({ amenidadId: a.amenidad_id, cantidad: a.cantidad })),
    });
    return aPropiedadWire(propiedad);
  }

  /** HU-003 (RN-026) — duplicar como plantilla. Agente solo las propias. */
  @Post(":id/duplicar")
  @HttpCode(HttpStatus.CREATED)
  @Roles("administrador", "agente", "editor")
  async duplicar(@Param("id") id: string, @UsuarioActual() usuario: Usuario): Promise<PropiedadWire> {
    const copia = await this.duplicarPropiedadUseCase.ejecutar({ actor: aActor(usuario), id });
    return aPropiedadWire(copia);
  }

  /** RN-027 — archivar (borrado lógico). Restringido a Administrador/Editor (ADR-014). */
  @Post(":id/archivar")
  @Roles("administrador", "editor")
  async archivar(@Param("id") id: string, @UsuarioActual() usuario: Usuario): Promise<PropiedadWire> {
    const propiedad = await this.archivarPropiedadUseCase.ejecutar({ actor: aActor(usuario), id });
    return aPropiedadWire(propiedad);
  }

  /** RN-027 — restaurar una propiedad archivada. Acción excepcional reservada al Administrador. */
  @Post(":id/restaurar")
  @Roles("administrador")
  async restaurar(@Param("id") id: string, @UsuarioActual() usuario: Usuario): Promise<PropiedadWire> {
    const propiedad = await this.restaurarPropiedadUseCase.ejecutar({ actor: aActor(usuario), id });
    return aPropiedadWire(propiedad);
  }

  /** CU-003 (HU-002) — cambiar estado según la máquina de estados (RN-012). Agente solo las propias. */
  @Patch(":id/estado")
  @Roles("administrador", "agente", "editor")
  async cambiarEstado(
    @Param("id") id: string,
    @Body() dto: CambiarEstadoPropiedadDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<PropiedadWire> {
    const propiedad = await this.cambiarEstadoPropiedadUseCase.ejecutar({
      actor: aActor(usuario),
      id,
      estadoNuevo: dto.estado_nuevo,
      nota: dto.nota ?? null,
    });
    return aPropiedadWire(propiedad);
  }

  /** GET .../historial — historial cronológico de cambios de estado (ADR-006). Agente solo las propias. */
  @Get(":id/historial")
  @Roles("administrador", "agente", "editor")
  async historial(
    @Param("id") id: string,
    @UsuarioActual() usuario: Usuario,
  ): Promise<HistorialEstadoWire[]> {
    const entradas = await this.listarHistorialUseCase.ejecutar({ actor: aActor(usuario), id });
    return entradas.map(aHistorialWire);
  }
}
