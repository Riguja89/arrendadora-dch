import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ObtenerConfiguracionUseCase } from "../../application/use-cases/obtener-configuracion.use-case";
import { ActualizarConfiguracionUseCase } from "../../application/use-cases/actualizar-configuracion.use-case";
import { ActualizarConfiguracionDto } from "./dto/actualizar-configuracion.dto";
import { aConfiguracionWire, type ConfiguracionSistemaWire } from "./mappers/configuracion.mapper";
import { SessionAuthGuard } from "../../../auth-usuarios/infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "../../../auth-usuarios/infrastructure/http/guards/roles.guard";
import { Roles } from "../../../auth-usuarios/infrastructure/http/decorators/roles.decorator";
import { UsuarioActual } from "../../../auth-usuarios/infrastructure/http/decorators/usuario-actual.decorator";
import type { Usuario } from "../../../auth-usuarios/domain/entities/usuario.entity";

/**
 * Configuración del sistema (ADR-016, singleton). `GET/PUT /admin/configuracion` — ambos exigen rol
 * **Administrador** (RN-016/RN-035, ADR-014). Reutiliza los guards de `auth-usuarios` (Customer/
 * Supplier, DESIGN-027). El Portal Público NO usa este controller: consume `ConfiguracionQueryPort`.
 */
@Controller("admin/configuracion")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("administrador")
export class ConfiguracionController {
  constructor(
    private readonly obtenerConfiguracionUseCase: ObtenerConfiguracionUseCase,
    private readonly actualizarConfiguracionUseCase: ActualizarConfiguracionUseCase,
  ) {}

  @Get()
  async obtener(): Promise<ConfiguracionSistemaWire> {
    const configuracion = await this.obtenerConfiguracionUseCase.ejecutar();
    return aConfiguracionWire(configuracion);
  }

  @Put()
  async actualizar(
    @Body() dto: ActualizarConfiguracionDto,
    @UsuarioActual() actor: Usuario,
  ): Promise<ConfiguracionSistemaWire> {
    const configuracion = await this.actualizarConfiguracionUseCase.ejecutar({
      actorId: actor.id,
      whatsappNumeroCentral: dto.whatsapp_numero_central,
      whatsappPlantillaMensaje: dto.whatsapp_plantilla_mensaje,
      nombreInmobiliaria: dto.nombre_inmobiliaria,
      imagenGenericaUrl: dto.imagen_generica_url,
    });
    return aConfiguracionWire(configuracion);
  }
}
