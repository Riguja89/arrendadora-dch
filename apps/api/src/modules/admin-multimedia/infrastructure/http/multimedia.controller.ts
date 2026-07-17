import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Body,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CargarFotosUseCase, type ArchivoParaCargar } from "../../application/use-cases/cargar-fotos.use-case";
import { ListarFotosUseCase } from "../../application/use-cases/listar-fotos.use-case";
import { ReordenarFotosUseCase } from "../../application/use-cases/reordenar-fotos.use-case";
import { DefinirPortadaUseCase } from "../../application/use-cases/definir-portada.use-case";
import { EliminarFotoUseCase } from "../../application/use-cases/eliminar-foto.use-case";
import type { Actor } from "../../domain/types/rol-actor";
import { ReordenarFotosDto } from "./dto/reordenar-fotos.dto";
import { aFotoWire, type FotoWire } from "./mappers/foto.mapper";
import {
  ALMACENAMIENTO_OBJETOS,
  type AlmacenamientoObjetosPort,
} from "../../domain/ports/almacenamiento-objetos.port";
import { SessionAuthGuard } from "../../../auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../../../auth-usuarios/infrastructure/http/guards/roles.guard";
import { Roles } from "../../../auth-usuarios/infrastructure/http/decorators/roles.decorator";
import { UsuarioActual } from "../../../auth-usuarios/infrastructure/http/decorators/usuario-actual.decorator";
import type { Usuario } from "../../../auth-usuarios/domain/entities/usuario.entity";

/** Archivo recibido por multipart (multer, memory storage). Shape local para no depender de `@types/multer`. */
interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Traduce el `Usuario` autenticado (auth-usuarios, upstream) al `Actor` puro del dominio propio. */
function aActor(usuario: Usuario): Actor {
  return { id: usuario.id, rol: usuario.rol };
}

/** Respuesta 207 de la carga múltiple (DESIGN-028): fotos cargadas + archivos rechazados por archivo. */
interface CargaFotosWire {
  cargadas: FotoWire[];
  rechazadas: { nombre_archivo: string; motivo: string }[];
}

/**
 * Multimedia de una propiedad (ANALYZE-004, contrato DESIGN-028). Fotos como composición del
 * aggregate `Propiedad` (DESIGN-027). Todos los endpoints exigen sesión activa (`SessionAuthGuard`)
 * + RBAC por handler (`RolesGuard`, ADR-014); el alcance fino (Agente solo las propias, RN-010) lo
 * aplica cada caso de uso vía `puedeGestionarMultimedia`.
 */
@Controller("admin/propiedades/:id/fotos")
@UseGuards(SessionAuthGuard, RolesGuard)
export class MultimediaController {
  constructor(
    private readonly cargarFotosUseCase: CargarFotosUseCase,
    private readonly listarFotosUseCase: ListarFotosUseCase,
    private readonly reordenarFotosUseCase: ReordenarFotosUseCase,
    private readonly definirPortadaUseCase: DefinirPortadaUseCase,
    private readonly eliminarFotoUseCase: EliminarFotoUseCase,
    @Inject(ALMACENAMIENTO_OBJETOS) private readonly almacenamiento: AlmacenamientoObjetosPort,
  ) {}

  /**
   * CU-001 (HU-001) — carga múltiple. 207 con el detalle por archivo (RN-028). Administrador/Editor;
   * el Agente solo sobre sus propiedades.
   */
  @Post()
  @HttpCode(207) // 207 Multi-Status (RN-028): NestJS HttpStatus no expone MULTI_STATUS.
  @Roles("administrador", "agente", "editor")
  @UseInterceptors(FilesInterceptor("archivos"))
  async cargar(
    @Param("id") id: string,
    @UploadedFiles() archivos: ArchivoSubido[] | undefined,
    @UsuarioActual() usuario: Usuario,
  ): Promise<CargaFotosWire> {
    const entrantes: ArchivoParaCargar[] = (archivos ?? []).map((a) => ({
      nombre: a.originalname,
      mime: a.mimetype,
      tamanoBytes: a.size,
      datos: a.buffer,
    }));
    const { cargadas, rechazadas } = await this.cargarFotosUseCase.ejecutar({
      actor: aActor(usuario),
      propiedadId: id,
      archivos: entrantes,
    });
    return {
      cargadas: cargadas.map((f) => aFotoWire(f, this.almacenamiento)),
      rechazadas: rechazadas.map((r) => ({ nombre_archivo: r.nombreArchivo, motivo: r.motivo })),
    };
  }

  /**
   * Lista la galería de la propiedad (panel). Endpoint ADITIVO al contrato (DESIGN-028 no declara el
   * GET, pero el panel necesita cargar la galería al abrir la ficha). Ver desviación en CLAUDE.md.
   */
  @Get()
  @Roles("administrador", "agente", "editor")
  async listar(@Param("id") id: string, @UsuarioActual() usuario: Usuario): Promise<FotoWire[]> {
    const fotos = await this.listarFotosUseCase.ejecutar({ actor: aActor(usuario), propiedadId: id });
    return fotos.map((f) => aFotoWire(f, this.almacenamiento));
  }

  /** CU-002 / RN-031 — reordenar la galería. Administrador/Editor (DESIGN-028). */
  @Patch("orden")
  @Roles("administrador", "editor")
  async reordenar(
    @Param("id") id: string,
    @Body() dto: ReordenarFotosDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<FotoWire[]> {
    const fotos = await this.reordenarFotosUseCase.ejecutar({
      actor: aActor(usuario),
      propiedadId: id,
      ordenIds: dto.orden,
    });
    return fotos.map((f) => aFotoWire(f, this.almacenamiento));
  }

  /** RN-014 — definir foto de portada. Administrador/Editor (DESIGN-028). */
  @Patch(":fotoId/portada")
  @Roles("administrador", "editor")
  async definirPortada(
    @Param("id") id: string,
    @Param("fotoId") fotoId: string,
    @UsuarioActual() usuario: Usuario,
  ): Promise<FotoWire[]> {
    const fotos = await this.definirPortadaUseCase.ejecutar({
      actor: aActor(usuario),
      propiedadId: id,
      fotoId,
    });
    return fotos.map((f) => aFotoWire(f, this.almacenamiento));
  }

  /** RN-032 — eliminar una foto. Administrador/Editor (DESIGN-028). 204 sin cuerpo. */
  @Delete(":fotoId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles("administrador", "editor")
  async eliminar(
    @Param("id") id: string,
    @Param("fotoId") fotoId: string,
    @UsuarioActual() usuario: Usuario,
  ): Promise<void> {
    await this.eliminarFotoUseCase.ejecutar({ actor: aActor(usuario), propiedadId: id, fotoId });
  }
}
