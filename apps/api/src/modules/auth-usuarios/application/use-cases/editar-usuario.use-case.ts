import { Inject, Injectable } from "@nestjs/common";
import type { Usuario } from "../../domain/entities/usuario.entity";
import type { Rol } from "../../domain/types/rol";
import { AutoproteccionAdministradorError, UsuarioNoEncontradoError } from "../../domain/errors/dominio-auth.errors";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface EditarUsuarioInput {
  id: string;
  actorId: string;
  nombre?: string;
  rol?: Rol;
  whatsapp?: string | null;
}

/**
 * PUT /admin/usuarios/{id} — edita nombre/rol/whatsapp (email no editable, ANALYZE-005).
 * CU-004 5a — el Administrador no puede autocambiar su propio rol.
 */
@Injectable()
export class EditarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: EditarUsuarioInput): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(input.id);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }

    const cambiaSuPropioRol = input.rol !== undefined && input.id === input.actorId && input.rol !== usuario.rol;
    if (cambiaSuPropioRol) {
      throw new AutoproteccionAdministradorError();
    }

    usuario.editarPerfil(
      { nombre: input.nombre, rol: input.rol, whatsapp: input.whatsapp },
      this.reloj.ahora(),
    );
    await this.usuarios.guardar(usuario);
    return usuario;
  }
}
