import type { Usuario } from "../entities/usuario.entity";
import type { EstadoUsuario } from "../types/estado-usuario";
import type { Rol } from "../types/rol";

export const USUARIO_REPOSITORY = Symbol("UsuarioRepositoryPort");

export interface ListarUsuariosFiltro {
  estado?: EstadoUsuario;
  rol?: Rol;
  skip: number;
  take: number;
}

export interface ListarUsuariosResultado {
  items: Usuario[];
  total: number;
}

/** Puerto de persistencia del aggregate Usuario. Implementado por el adaptador Prisma. */
export interface UsuarioRepositoryPort {
  guardar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  existeEmail(email: string): Promise<boolean>;
  listar(filtro: ListarUsuariosFiltro): Promise<ListarUsuariosResultado>;
}
