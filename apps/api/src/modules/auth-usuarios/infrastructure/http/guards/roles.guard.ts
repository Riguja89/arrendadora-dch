import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Rol } from "../../../domain/types/rol";
import { SinPermisoRbacError } from "../../../domain/errors/dominio-auth.errors";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { RequestConUsuario } from "./session-auth.guard";

/** RBAC por handler (ADR-014). Debe ejecutarse SIEMPRE después de `SessionAuthGuard`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    if (!rolesRequeridos.includes(request.usuario.rol)) {
      throw new SinPermisoRbacError();
    }
    return true;
  }
}
