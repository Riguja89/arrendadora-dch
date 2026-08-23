import { describe, expect, it } from "vitest";
import { cumplePoliticaPassword, Password } from "./password.vo";
import { PasswordInvalidaError } from "../errors/dominio-auth.errors";

describe("cumplePoliticaPassword (RN-034)", () => {
  it("acepta una contraseña con mayúscula, minúscula, número y mínimo 8 caracteres", () => {
    expect(cumplePoliticaPassword("Abcdefg1")).toBe(true);
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    expect(cumplePoliticaPassword("Ab1defg")).toBe(false);
  });

  it("rechaza contraseñas sin mayúscula", () => {
    expect(cumplePoliticaPassword("abcdefg1")).toBe(false);
  });

  it("rechaza contraseñas sin minúscula", () => {
    expect(cumplePoliticaPassword("ABCDEFG1")).toBe(false);
  });

  it("rechaza contraseñas sin número", () => {
    expect(cumplePoliticaPassword("Abcdefgh")).toBe(false);
  });

  it("rechaza valores no-string", () => {
    // @ts-expect-error -- verificación defensiva de runtime ante input no tipado
    expect(cumplePoliticaPassword(12345678)).toBe(false);
  });
});

describe("Password", () => {
  it("crea la instancia cuando la contraseña cumple la política", () => {
    const password = Password.crear("Abcdefg1");
    expect(password.plano).toBe("Abcdefg1");
  });

  it("lanza PasswordInvalidaError cuando no cumple la política", () => {
    expect(() => Password.crear("corta1")).toThrow(PasswordInvalidaError);
  });

  it("propaga el nombre de campo al error de dominio", () => {
    try {
      Password.crear("corta1", "password_actual");
      expect.fail("debía lanzar PasswordInvalidaError");
    } catch (error) {
      expect(error).toBeInstanceOf(PasswordInvalidaError);
      const dominioError = error as PasswordInvalidaError;
      expect(dominioError.detalles?.[0]?.campo).toBe("password_actual");
      expect(dominioError.httpStatus).toBe(422);
    }
  });
});
