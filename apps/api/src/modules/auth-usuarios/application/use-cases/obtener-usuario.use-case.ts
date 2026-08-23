import { Inject, Injectable } from "@nestjs/common";
import type { Usuario } from "../../domain/entities/usuario.entity";
import { UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";

/** GET /admin/usuarios/{id} — obtener un usuario (solo Administrador). */
@Injectable()
export class ObtenerUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  async ejecutar(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }
    return usuario;
  }
}
