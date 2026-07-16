import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Patch, Query, UseGuards } from "@nestjs/common";
import type { Usuario as UsuarioWire } from "@arrendadora/shared";
import { CrearUsuarioUseCase } from "../../application/use-cases/crear-usuario.use-case";
import { ListarUsuariosUseCase } from "../../application/use-cases/listar-usuarios.use-case";
import { ObtenerUsuarioUseCase } from "../../application/use-cases/obtener-usuario.use-case";
import { EditarUsuarioUseCase } from "../../application/use-cases/editar-usuario.use-case";
import { CambiarEstadoUsuarioUseCase } from "../../application/use-cases/cambiar-estado-usuario.use-case";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { EditarUsuarioDto } from "./dto/editar-usuario.dto";
import { CambiarEstadoDto } from "./dto/cambiar-estado.dto";
import { ListarUsuariosQueryDto } from "./dto/listar-usuarios-query.dto";
import { aPaginacionWire, aUsuarioWire, type PaginacionMetaWire } from "./mappers/usuario.mapper";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { UsuarioActual } from "./decorators/usuario-actual.decorator";
import type { Usuario } from "../../domain/entities/usuario.entity";

/** Gestión de usuarios internos (ANALYZE-005) — todos los endpoints exigen rol Administrador (ADR-014). */
@Controller("admin/usuarios")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("administrador")
export class UsuariosController {
  constructor(
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
    private readonly listarUsuariosUseCase: ListarUsuariosUseCase,
    private readonly obtenerUsuarioUseCase: ObtenerUsuarioUseCase,
    private readonly editarUsuarioUseCase: EditarUsuarioUseCase,
    private readonly cambiarEstadoUsuarioUseCase: CambiarEstadoUsuarioUseCase,
  ) {}

  @Get()
  async listar(
    @Query() query: ListarUsuariosQueryDto,
  ): Promise<{ data: UsuarioWire[]; meta: PaginacionMetaWire }> {
    const { items, total } = await this.listarUsuariosUseCase.ejecutar({
      estado: query.estado,
      rol: query.rol,
      pagina: query.pagina,
      tamanoPagina: query.tamanoPagina,
    });
    return {
      data: items.map(aUsuarioWire),
      meta: aPaginacionWire(total, query.pagina, query.tamanoPagina),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearUsuarioDto): Promise<UsuarioWire & { password_temporal: string }> {
    const { usuario, passwordTemporal } = await this.crearUsuarioUseCase.ejecutar({
      nombre: dto.nombre,
      email: dto.email,
      rol: dto.rol,
      whatsapp: dto.whatsapp ?? null,
    });
    // Campo aditivo no documentado en el schema `Usuario` del OpenAPI (que no acepta password
    // de entrada): única forma de que el Administrador conozca la temporal para compartirla
    // (GAP-004 opción A). Ver CLAUDE.md del módulo — nota de compatibilidad de contrato.
    return { ...aUsuarioWire(usuario), password_temporal: passwordTemporal };
  }

  @Get(":id")
  async obtener(@Param("id") id: string): Promise<UsuarioWire> {
    const usuario = await this.obtenerUsuarioUseCase.ejecutar(id);
    return aUsuarioWire(usuario);
  }

  @Put(":id")
  async editar(
    @Param("id") id: string,
    @Body() dto: EditarUsuarioDto,
    @UsuarioActual() actor: Usuario,
  ): Promise<UsuarioWire> {
    const usuario = await this.editarUsuarioUseCase.ejecutar({
      id,
      actorId: actor.id,
      nombre: dto.nombre,
      rol: dto.rol,
      whatsapp: dto.whatsapp,
    });
    return aUsuarioWire(usuario);
  }

  @Patch(":id/estado")
  async cambiarEstado(
    @Param("id") id: string,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual() actor: Usuario,
  ): Promise<UsuarioWire> {
    const usuario = await this.cambiarEstadoUsuarioUseCase.ejecutar({
      id,
      actorId: actor.id,
      accion: dto.accion,
    });
    return aUsuarioWire(usuario);
  }
}
