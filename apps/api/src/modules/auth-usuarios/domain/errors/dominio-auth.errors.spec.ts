import { describe, expect, it } from "vitest";
import { DominioError } from "../../../../common/errors/dominio-error.base";
import {
  AccionEstadoInvalidaError,
  AutoproteccionAdministradorError,
  CredencialesInvalidasError,
  CuentaBloqueadaError,
  CuentaDesactivadaError,
  EmailInvalidoError,
  EmailYaRegistradoError,
  PasswordActualIncorrectaError,
  PasswordInvalidaError,
  SesionInvalidaError,
  SinPermisoRbacError,
  TokenRecuperacionInvalidoError,
  UsuarioNoEncontradoError,
} from "./dominio-auth.errors";

describe("errores de dominio de auth-usuarios", () => {
  it.each([
    { Ctor: CredencialesInvalidasError, httpStatus: 401, codigo: "UNAUTHENTICATED" },
    { Ctor: CuentaDesactivadaError, httpStatus: 403, codigo: "FORBIDDEN" },
    { Ctor: CuentaBloqueadaError, httpStatus: 403, codigo: "FORBIDDEN" },
    { Ctor: SesionInvalidaError, httpStatus: 401, codigo: "UNAUTHENTICATED" },
    { Ctor: SinPermisoRbacError, httpStatus: 403, codigo: "FORBIDDEN" },
    { Ctor: EmailYaRegistradoError, httpStatus: 409, codigo: "CONFLICT" },
    { Ctor: UsuarioNoEncontradoError, httpStatus: 404, codigo: "NOT_FOUND" },
    { Ctor: TokenRecuperacionInvalidoError, httpStatus: 409, codigo: "CONFLICT" },
    { Ctor: AutoproteccionAdministradorError, httpStatus: 409, codigo: "CONFLICT" },
    { Ctor: AccionEstadoInvalidaError, httpStatus: 409, codigo: "CONFLICT" },
  ])("$Ctor.name expone httpStatus=$httpStatus y codigo=$codigo", ({ Ctor, httpStatus, codigo }) => {
    const error = new Ctor();
    expect(error).toBeInstanceOf(DominioError);
    expect(error.httpStatus).toBe(httpStatus);
    expect(error.codigo).toBe(codigo);
    expect(error.message.length).toBeGreaterThan(0);
    expect(error.name).toBe(Ctor.name);
  });

  it("PasswordActualIncorrectaError expone detalle sobre el campo password_actual", () => {
    const error = new PasswordActualIncorrectaError();
    expect(error.httpStatus).toBe(422);
    expect(error.codigo).toBe("UNPROCESSABLE_ENTITY");
    expect(error.detalles).toEqual([
      { campo: "password_actual", mensaje: "La contraseña actual no es correcta." },
    ]);
  });

  it("PasswordInvalidaError usa 'password_nueva' como campo por defecto", () => {
    const error = new PasswordInvalidaError();
    expect(error.detalles?.[0]?.campo).toBe("password_nueva");
  });

  it("PasswordInvalidaError acepta un campo custom", () => {
    const error = new PasswordInvalidaError("password_actual");
    expect(error.detalles?.[0]?.campo).toBe("password_actual");
  });

  it("EmailInvalidoError usa 'email' como campo por defecto", () => {
    const error = new EmailInvalidoError();
    expect(error.detalles?.[0]?.campo).toBe("email");
    expect(error.httpStatus).toBe(422);
  });

  it("EmailInvalidoError acepta un campo custom", () => {
    const error = new EmailInvalidoError("correo_alternativo");
    expect(error.detalles?.[0]?.campo).toBe("correo_alternativo");
  });
});
