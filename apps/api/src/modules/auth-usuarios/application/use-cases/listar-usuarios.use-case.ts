import { Inject, Injectable } from "@nestjs/common";
import type { Usuario } from "../../domain/entities/usuario.entity";
import type { EstadoUsuario } from "../../domain/types/estado-usuario";
import type { Rol } from "../../domain/types/rol";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";

export interface ListarUsuariosInput {
  estado?: EstadoUsuario;
  rol?: Rol;
  pagina: number;
  tamanoPagina: number;
}

export interface ListarUsuariosResultado {
  items: Usuario[];
  total: number;
}

/** GET /admin/usuarios — listado paginado y filtrable (solo Administrador). */
@Injectable()
export class ListarUsuariosUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort) {}

  async ejecutar(input: ListarUsuariosInput): Promise<ListarUsuariosResultado> {
    const skip = (input.pagina - 1) * input.tamanoPagina;
    return this.usuarios.listar({
      estado: input.estado,
      rol: input.rol,
      skip,
      take: input.tamanoPagina,
    });
  }
}
