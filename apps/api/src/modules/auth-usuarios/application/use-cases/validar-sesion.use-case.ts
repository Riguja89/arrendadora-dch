import { Inject, Injectable } from "@nestjs/common";
import type { Usuario } from "../../domain/entities/usuario.entity";
import type { Sesion } from "../../domain/entities/sesion.entity";
import { SesionInvalidaError } from "../../domain/errors/dominio-auth.errors";
import { SESION_TTL_MINUTOS } from "../../domain/rules/auth-constantes";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface ValidarSesionInput {
  sesionId: string;
}

export interface ValidarSesionResultado {
  usuario: Usuario;
  sesion: Sesion;
}

/**
 * Guard de autenticación (usado por `SessionAuthGuard`). Sliding TTL (GAP-005): cada request
 * autenticado renueva `expiraEn`. Si el usuario fue desactivado/bloqueado mientras la sesión
 * seguía viva (defensa en profundidad — el caso normal ya la borra de inmediato, ADR-004), la
 * sesión igual se rechaza.
 */
@Injectable()
export class ValidarSesionUseCase {
  constructor(
    @Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: ValidarSesionInput): Promise<ValidarSesionResultado> {
    const sesion = await this.sesiones.buscarPorId(input.sesionId);
    if (!sesion) {
      throw new SesionInvalidaError();
    }

    const ahora = this.reloj.ahora();
    if (sesion.estaExpirada(ahora)) {
      await this.sesiones.eliminar(sesion.id);
      throw new SesionInvalidaError();
    }

    const usuario = await this.usuarios.buscarPorId(sesion.usuarioId);
    if (!usuario || !usuario.estaActivo()) {
      await this.sesiones.eliminar(sesion.id);
      throw new SesionInvalidaError();
    }

    sesion.renovar(ahora, SESION_TTL_MINUTOS);
    await this.sesiones.guardar(sesion);

    return { usuario, sesion };
  }
}
