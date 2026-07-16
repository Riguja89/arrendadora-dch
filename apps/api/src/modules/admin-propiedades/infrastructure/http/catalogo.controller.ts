import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ListarCatalogoUseCase } from "../../application/use-cases/listar-catalogo.use-case";
import { CrearCatalogoUseCase } from "../../application/use-cases/crear-catalogo.use-case";
import { EditarCatalogoUseCase } from "../../application/use-cases/editar-catalogo.use-case";
import { DesactivarCatalogoUseCase } from "../../application/use-cases/desactivar-catalogo.use-case";
import { CrearCatalogoDto } from "./dto/crear-catalogo.dto";
import { EditarCatalogoDto } from "./dto/editar-catalogo.dto";
import { ListarCatalogoQueryDto } from "./dto/listar-catalogo-query.dto";
import { aCatalogoWire, type CatalogoWire } from "./mappers/propiedad.mapper";
import { SessionAuthGuard } from "../../../auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../../../auth-usuarios/infrastructure/http/guards/roles.guard";
import { Roles } from "../../../auth-usuarios/infrastructure/http/decorators/roles.decorator";

/**
 * Tokens de inyección de los casos de uso genéricos de catálogo, uno por catálogo administrable
 * (tipos de propiedad, amenidades). Los casos de uso son clases planas (no `@Injectable`) que se
 * instancian vía factory provider en el módulo — cada instancia queda ligada a su repositorio y a
 * sus etiquetas de mensajes (ADR-005). Ver `admin-propiedades.module.ts`.
 */
export const LISTAR_TIPO_PROPIEDAD_UC = Symbol("ListarTipoPropiedadUseCase");
export const CREAR_TIPO_PROPIEDAD_UC = Symbol("CrearTipoPropiedadUseCase");
export const EDITAR_TIPO_PROPIEDAD_UC = Symbol("EditarTipoPropiedadUseCase");
export const DESACTIVAR_TIPO_PROPIEDAD_UC = Symbol("DesactivarTipoPropiedadUseCase");

export const LISTAR_AMENIDAD_UC = Symbol("ListarAmenidadUseCase");
export const CREAR_AMENIDAD_UC = Symbol("CrearAmenidadUseCase");
export const EDITAR_AMENIDAD_UC = Symbol("EditarAmenidadUseCase");
export const DESACTIVAR_AMENIDAD_UC = Symbol("DesactivarAmenidadUseCase");

/**
 * Lógica HTTP compartida de un catálogo administrable (DESIGN-028, ADR-005). Ambos catálogos
 * (`/admin/tipos-propiedad` y `/admin/amenidades`) tienen forma y RBAC idénticos, así que las rutas
 * viven aquí y las subclases solo aportan su `@Controller(path)` y sus casos de uso concretos.
 *
 * RBAC por handler (ADR-014): listar exige solo sesión activa; crear/editar → Administrador/Editor;
 * desactivar (borrado lógico) → Administrador.
 */
@UseGuards(SessionAuthGuard, RolesGuard)
export abstract class CatalogoBaseController {
  protected constructor(
    private readonly listarUseCase: ListarCatalogoUseCase,
    private readonly crearUseCase: CrearCatalogoUseCase,
    private readonly editarUseCase: EditarCatalogoUseCase,
    private readonly desactivarUseCase: DesactivarCatalogoUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ListarCatalogoQueryDto): Promise<CatalogoWire[]> {
    const items = await this.listarUseCase.ejecutar(query.incluir_inactivos ?? false);
    return items.map(aCatalogoWire);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles("administrador", "editor")
  async crear(@Body() dto: CrearCatalogoDto): Promise<CatalogoWire> {
    const item = await this.crearUseCase.ejecutar({ nombre: dto.nombre, orden: dto.orden ?? 0 });
    return aCatalogoWire(item);
  }

  @Patch(":id")
  @Roles("administrador", "editor")
  async editar(@Param("id") id: string, @Body() dto: EditarCatalogoDto): Promise<CatalogoWire> {
    const item = await this.editarUseCase.ejecutar({
      id,
      nombre: dto.nombre,
      orden: dto.orden,
      activo: dto.activo,
    });
    return aCatalogoWire(item);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles("administrador")
  async desactivar(@Param("id") id: string): Promise<void> {
    await this.desactivarUseCase.ejecutar(id);
  }
}

/** GET/POST /admin/tipos-propiedad · PATCH/DELETE /admin/tipos-propiedad/{id} (Catálogos, DESIGN-028). */
@Controller("admin/tipos-propiedad")
export class TiposPropiedadController extends CatalogoBaseController {
  constructor(
    @Inject(LISTAR_TIPO_PROPIEDAD_UC) listar: ListarCatalogoUseCase,
    @Inject(CREAR_TIPO_PROPIEDAD_UC) crear: CrearCatalogoUseCase,
    @Inject(EDITAR_TIPO_PROPIEDAD_UC) editar: EditarCatalogoUseCase,
    @Inject(DESACTIVAR_TIPO_PROPIEDAD_UC) desactivar: DesactivarCatalogoUseCase,
  ) {
    super(listar, crear, editar, desactivar);
  }
}

/** GET/POST /admin/amenidades · PATCH/DELETE /admin/amenidades/{id} (Catálogos, DESIGN-028). */
@Controller("admin/amenidades")
export class AmenidadesController extends CatalogoBaseController {
  constructor(
    @Inject(LISTAR_AMENIDAD_UC) listar: ListarCatalogoUseCase,
    @Inject(CREAR_AMENIDAD_UC) crear: CrearCatalogoUseCase,
    @Inject(EDITAR_AMENIDAD_UC) editar: EditarCatalogoUseCase,
    @Inject(DESACTIVAR_AMENIDAD_UC) desactivar: DesactivarCatalogoUseCase,
  ) {
    super(listar, crear, editar, desactivar);
  }
}
