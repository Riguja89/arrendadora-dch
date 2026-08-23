import { Inject, Injectable } from "@nestjs/common";
import { Password } from "../../domain/value-objects/password.vo";
import { PasswordActualIncorrectaError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface CambiarPasswordInput {
  usuarioId: string;
  passwordActual: string;
  passwordNueva: string;
}

/**
 * POST /auth/change-password — cambio de contraseña del usuario autenticado. Obligatorio en
 * el primer login cuando `requiere_cambio_password = true` (GAP-004). Decisión del módulo (no
 * exigida explícitamente por ADR-004, ver CLAUDE.md): revoca TODAS las sesiones del usuario
 * — incluida la actual — como buena práctica de seguridad ante cambio de credenciales; el
 * cliente debe re-loguear después de un cambio exitoso.
 */
@Injectable()
export class CambiarPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: CambiarPasswordInput): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }

    const actualValida = await this.hasher.verificar(input.passwordActual, usuario.passwordHash);
    if (!actualValida) {
      throw new PasswordActualIncorrectaError();
    }

    const nueva = Password.crear(input.passwordNueva, "password_nueva");
    const hash = await this.hasher.hash(nueva.plano);
    usuario.cambiarPassword(hash, this.reloj.ahora());
    await this.usuarios.guardar(usuario);

    await this.sesiones.eliminarTodasDeUsuario(usuario.id);
  }
}
