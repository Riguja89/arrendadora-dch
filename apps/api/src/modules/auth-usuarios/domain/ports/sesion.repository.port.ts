import type { Sesion } from "../entities/sesion.entity";

export const SESION_REPOSITORY = Symbol("SesionRepositoryPort");

/** Puerto de persistencia de Sesion — soporta la revocación inmediata exigida por ADR-004. */
export interface SesionRepositoryPort {
  guardar(sesion: Sesion): Promise<void>;
  buscarPorId(id: string): Promise<Sesion | null>;
  eliminar(id: string): Promise<void>;
  eliminarTodasDeUsuario(usuarioId: string): Promise<void>;
}
