import type { DetalleErrorCampo } from "@arrendadora/shared";
import { DominioError } from "../../../../common/errors/dominio-error.base";

/** CU-001 4b — credenciales incorrectas. Mensaje genérico: no revela cuál campo falló. */
export class CredencialesInvalidasError extends DominioError {
  readonly httpStatus = 401;
  readonly codigo = "UNAUTHENTICATED" as const;
  constructor() {
    super("Email o contraseña incorrectos.");
  }
}

/** RN-037, CU-001 4c — cuenta desactivada por el Administrador. */
export class CuentaDesactivadaError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("Tu cuenta no está activa. Contactá al Administrador.");
  }
}

/** GAP-006, ADR-004 — bloqueo permanente tras 5 intentos fallidos; solo el Administrador desbloquea. */
export class CuentaBloqueadaError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("Tu cuenta está bloqueada. Contactá al Administrador para desbloquearla.");
  }
}

/** ADR-004 — sesión ausente, inválida o vencida (sliding TTL de 30 min). */
export class SesionInvalidaError extends DominioError {
  readonly httpStatus = 401;
  readonly codigo = "UNAUTHENTICATED" as const;
  constructor() {
    super("Tu sesión no es válida o ha expirado. Iniciá sesión nuevamente.");
  }
}

/** ADR-014 — el rol del usuario autenticado no autoriza la operación (RBAC). */
export class SinPermisoRbacError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("Tu rol no tiene permiso para realizar esta acción.");
  }
}

/** CU-003 4b — email duplicado. */
export class EmailYaRegistradoError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("Ya existe un usuario con ese email.");
  }
}

/** GET/PUT/PATCH /admin/usuarios/{id} — recurso inexistente. */
export class UsuarioNoEncontradoError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor() {
    super("El usuario solicitado no existe.");
  }
}

/** CU-002 7a — enlace de recuperación vencido, ya usado o inexistente (RN-019). */
export class TokenRecuperacionInvalidoError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("Este enlace ya no es válido. Solicitá uno nuevo.");
  }
}

/** POST /auth/change-password — password_actual no coincide con el hash almacenado. */
export class PasswordActualIncorrectaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      { campo: "password_actual", mensaje: "La contraseña actual no es correcta." },
    ];
    super("La contraseña actual no es correcta.", detalles);
  }
}

/** RN-034 — la contraseña no cumple el mínimo (8 chars, mayúscula, minúscula, número). */
export class PasswordInvalidaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor(campo = "password_nueva") {
    const detalles: DetalleErrorCampo[] = [
      {
        campo,
        mensaje:
          "La contraseña debe tener mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.",
      },
    ];
    super(
      "La contraseña debe tener mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.",
      detalles,
    );
  }
}

/** CU-004 5a — el Administrador no puede autodesactivarse ni autocambiar su propio rol. */
export class AutoproteccionAdministradorError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("No podés modificar tu propio rol ni desactivar tu propia cuenta.");
  }
}

/** PATCH /admin/usuarios/{id}/estado — la acción no es compatible con el estado actual. */
export class AccionEstadoInvalidaError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("La acción solicitada no es compatible con el estado actual del usuario.");
  }
}

/** RN-038 (superseded) — reservado; ver domain/types/rol.ts y CLAUDE.md del módulo. */
export class EmailInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor(campo = "email") {
    const detalles: DetalleErrorCampo[] = [{ campo, mensaje: "El correo electrónico no es válido." }];
    super("El correo electrónico no es válido.", detalles);
  }
}
