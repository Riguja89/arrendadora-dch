import { describe, expect, it } from "vitest";
import { Email } from "./email.vo";
import { EmailInvalidoError } from "../errors/dominio-auth.errors";

describe("Email", () => {
  it("normaliza el valor (trim + lowercase)", () => {
    const email = Email.crear("  Ana.Perez@Arrendadora.COM  ");
    expect(email.valor).toBe("ana.perez@arrendadora.com");
    expect(email.toString()).toBe("ana.perez@arrendadora.com");
  });

  it("acepta un formato de email válido", () => {
    expect(() => Email.crear("valido@dominio.com")).not.toThrow();
  });

  it.each(["", "sin-arroba.com", "sin-dominio@", "@sin-usuario.com", "espacio interno@dominio.com"])(
    "rechaza formatos inválidos: %s",
    (valor) => {
      expect(() => Email.crear(valor)).toThrow(EmailInvalidoError);
    },
  );

  it("propaga el nombre de campo al error de dominio", () => {
    try {
      Email.crear("invalido", "correo_contacto");
      expect.fail("debía lanzar EmailInvalidoError");
    } catch (error) {
      expect(error).toBeInstanceOf(EmailInvalidoError);
      const dominioError = error as EmailInvalidoError;
      expect(dominioError.detalles?.[0]?.campo).toBe("correo_contacto");
      expect(dominioError.httpStatus).toBe(422);
      expect(dominioError.codigo).toBe("UNPROCESSABLE_ENTITY");
    }
  });
});
