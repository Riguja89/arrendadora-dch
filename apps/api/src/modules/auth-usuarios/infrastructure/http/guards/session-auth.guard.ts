import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { ValidarSesionUseCase } from "../../../application/use-cases/validar-sesion.use-case";
import { SesionInvalidaError } from "../../../domain/errors/dominio-auth.errors";
import type { Usuario } from "../../../domain/entities/usuario.entity";
import { COOKIE_SESION, parsearCookies } from "../cookie.util";
import type { RequestConCorrelationId } from "../../../../../common/http/correlation-id.middleware";

export interface RequestConUsuario extends RequestConCorrelationId {
  usuario: Usuario;
  sesionId: string;
}

/**
 * Valida la cookie de sesión `sid` (ADR-004) e inyecta `request.usuario` / `request.sesionId`.
 * Cualquier endpoint que declare `security: [cookieAuth]` en el contrato usa este guard.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly validarSesion: ValidarSesionUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = parsearCookies(request.headers.cookie);
    const sesionId = cookies[COOKIE_SESION];

    if (!sesionId) {
      throw new SesionInvalidaError();
    }

    const { usuario, sesion } = await this.validarSesion.ejecutar({ sesionId });
    (request as RequestConUsuario).usuario = usuario;
    (request as RequestConUsuario).sesionId = sesion.id;
    return true;
  }
}
