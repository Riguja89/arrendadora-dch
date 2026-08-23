import { describe, expect, it } from "vitest";
import {
  MENSAJE_ENLACE_INVALIDO,
  MENSAJE_FORGOT_PASSWORD_NEUTRO,
  MENSAJE_PASSWORDS_NO_COINCIDEN,
  MENSAJE_PASSWORD_INVALIDA,
  construirPayloadCambioPassword,
  construirPayloadForgotPassword,
  construirPayloadResetPassword,
  mapearErroresValidacionPassword,
  validarCambioPassword,
  validarEmailRecuperacion,
  validarNuevaPassword,
} from "./password-validation";

describe("validarEmailRecuperacion", () => {
  it("acepta un email válido", () => {
    const resultado = validarEmailRecuperacion("usuario@inmobiliaria.com");
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it("exige el email", () => {
    const resultado = validarEmailRecuperacion("");
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.email).toBe("El correo electrónico es obligatorio.");
  });

  it("rechaza un email con formato inválido", () => {
    const resultado = validarEmailRecuperacion("no-es-un-email");
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.email).toBeDefined();
  });
});

describe("construirPayloadForgotPassword", () => {
  it("recorta espacios del email", () => {
    expect(construirPayloadForgotPassword("  usuario@inmobiliaria.com  ")).toEqual({
      email: "usuario@inmobiliaria.com",
    });
  });
});

describe("validarNuevaPassword (RN-034)", () => {
  it("acepta una contraseña que cumple la política y coincide con la confirmación", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "Segura123", confirmacion: "Segura123" });
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it("exige la nueva contraseña", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "", confirmacion: "" });
    expect(resultado.errores.password_nueva).toBe("La nueva contraseña es obligatoria.");
  });

  it("rechaza una contraseña sin mayúscula", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "segura123", confirmacion: "segura123" });
    expect(resultado.errores.password_nueva).toBe(MENSAJE_PASSWORD_INVALIDA);
  });

  it("rechaza una contraseña sin minúscula", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "SEGURA123", confirmacion: "SEGURA123" });
    expect(resultado.errores.password_nueva).toBe(MENSAJE_PASSWORD_INVALIDA);
  });

  it("rechaza una contraseña sin número", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "SeguraAbc", confirmacion: "SeguraAbc" });
    expect(resultado.errores.password_nueva).toBe(MENSAJE_PASSWORD_INVALIDA);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "Seg1", confirmacion: "Seg1" });
    expect(resultado.errores.password_nueva).toBe(MENSAJE_PASSWORD_INVALIDA);
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "Segura123", confirmacion: "Segura124" });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.confirmacion).toBe(MENSAJE_PASSWORDS_NO_COINCIDEN);
  });

  it("no reporta error de confirmación si la contraseña nueva ya es inválida", () => {
    const resultado = validarNuevaPassword({ passwordNueva: "abc", confirmacion: "xyz" });
    expect(resultado.errores.confirmacion).toBeUndefined();
  });
});

describe("construirPayloadResetPassword", () => {
  it("arma el payload con token + password_nueva", () => {
    expect(construirPayloadResetPassword("token-123", "Segura123")).toEqual({
      token: "token-123",
      password_nueva: "Segura123",
    });
  });
});

describe("validarCambioPassword", () => {
  it("acepta valores válidos", () => {
    const resultado = validarCambioPassword({
      passwordActual: "Temporal123",
      passwordNueva: "Segura123",
      confirmacion: "Segura123",
    });
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it("exige la contraseña actual", () => {
    const resultado = validarCambioPassword({ passwordActual: "", passwordNueva: "Segura123", confirmacion: "Segura123" });
    expect(resultado.errores.password_actual).toBe("La contraseña actual es obligatoria.");
  });

  it("valida la nueva contraseña con las mismas reglas RN-034", () => {
    const resultado = validarCambioPassword({ passwordActual: "Temporal123", passwordNueva: "corta", confirmacion: "corta" });
    expect(resultado.errores.password_nueva).toBe(MENSAJE_PASSWORD_INVALIDA);
  });

  it("acumula el error de contraseña actual junto con el de la nueva", () => {
    const resultado = validarCambioPassword({ passwordActual: "", passwordNueva: "corta", confirmacion: "otra" });
    expect(resultado.errores.password_actual).toBeDefined();
    expect(resultado.errores.password_nueva).toBeDefined();
  });
});

describe("construirPayloadCambioPassword", () => {
  it("arma el payload password_actual + password_nueva", () => {
    expect(
      construirPayloadCambioPassword({ passwordActual: "Temporal123", passwordNueva: "Segura123", confirmacion: "Segura123" }),
    ).toEqual({ password_actual: "Temporal123", password_nueva: "Segura123" });
  });
});

describe("mapearErroresValidacionPassword", () => {
  it("mapea detalles del 422 a errores por campo", () => {
    const errores = mapearErroresValidacionPassword([{ campo: "password_nueva", mensaje: "Mensaje del backend." }]);
    expect(errores).toEqual({ password_nueva: "Mensaje del backend." });
  });

  it("retorna objeto vacío si no hay detalles", () => {
    expect(mapearErroresValidacionPassword(undefined)).toEqual({});
  });
});

describe("mensajes RN-019", () => {
  it("expone el mensaje neutro exacto de la spec (CU-002 paso 4)", () => {
    expect(MENSAJE_FORGOT_PASSWORD_NEUTRO).toBe(
      "Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    );
  });

  it("expone el mensaje de enlace inválido exacto (CU-002 excepción 7a)", () => {
    expect(MENSAJE_ENLACE_INVALIDO).toBe("Este enlace ya no es válido. Solicitá uno nuevo.");
  });
});
