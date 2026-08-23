import { Inject, Injectable } from "@nestjs/common";
import type { Usuario } from "../../domain/entities/usuario.entity";
import type { AccionEstadoUsuario } from "@arrendadora/shared";
import {
  AccionEstadoInvalidaError,
  AutoproteccionAdministradorError,
  UsuarioNoEncontradoError,
} from "../../domain/errors/dominio-auth.errors";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface CambiarEstadoUsuarioInput {
  id: string;
  actorId: string;
  accion: AccionEstadoUsuario;
}

/**
 * PATCH /admin/usuarios/{id}/estado — activa, desactiva o desbloquea (solo Administrador).
 * Transiciones válidas: `activar` (desactivado → activo), `desactivar` (activo → desactivado,
 * revoca sesiones de inmediato — RN-037), `desbloquear` (bloqueado → activo, resetea el
 * contador de intentos — ADR-004). Cualquier otra combinación es 409 (contrato DESIGN-028).
 */
@Injectable()
export class CambiarEstadoUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: CambiarEstadoUsuarioInput): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(input.id);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }

    const ahora = this.reloj.ahora();

    switch (input.accion) {
      case "desactivar": {
        if (input.id === input.actorId) {
          throw new AutoproteccionAdministradorError();
        }
        if (!usuario.estaActivo()) {
          throw new AccionEstadoInvalidaError();
        }
        usuario.desactivar(ahora);
        await this.usuarios.guardar(usuario);
        await this.sesiones.eliminarTodasDeUsuario(usuario.id);
        return usuario;
      }
      case "activar": {
        if (!usuario.estaDesactivado()) {
          throw new AccionEstadoInvalidaError();
        }
        usuario.activar(ahora);
        await this.usuarios.guardar(usuario);
        return usuario;
      }
      case "desbloquear": {
        if (!usuario.estaBloqueado()) {
          throw new AccionEstadoInvalidaError();
        }
        usuario.desbloquear(ahora);
        await this.usuarios.guardar(usuario);
        return usuario;
      }
      default: {
        // Inalcanzable si el DTO valida `accion` con class-validator, pero se mantiene por
        // exhaustividad de tipos.
        throw new AccionEstadoInvalidaError();
      }
    }
  }
}
