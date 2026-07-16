import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Usuario } from "../../../domain/entities/usuario.entity";
import type { RequestConUsuario } from "../guards/session-auth.guard";

/** Extrae el `Usuario` autenticado adjuntado por `SessionAuthGuard`. */
export const UsuarioActual = createParamDecorator((_data: unknown, ctx: ExecutionContext): Usuario => {
  const request = ctx.switchToHttp().getRequest<RequestConUsuario>();
  return request.usuario;
});
