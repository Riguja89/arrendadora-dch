import { describe, expect, it } from "vitest";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto";
import { ForgotPasswordDto } from "./forgot-password.dto";
import { ResetPasswordDto } from "./reset-password.dto";
import { CrearUsuarioDto } from "./crear-usuario.dto";
import { CambiarEstadoDto } from "./cambiar-estado.dto";

/**
 * Verifica que los decoradores class-validator devuelven mensajes en español (regla de
 * ortografía ES, zero-tolerancia). El `exceptionFactory` global (main.ts) reenvía estos
 * mensajes al body 422 vía `ValidationHttpException`.
 */

async function mensajesDe(instancia: object): Promise<string[]> {
  const errores = await validate(instancia);
  return errores.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe("DTOs de auth-usuarios — mensajes de validación en español", () => {
  it("LoginDto: email inválido y password vacía producen mensajes ES", async () => {
    const dto = new LoginDto();
    dto.email = "no-es-un-email";
    dto.password = "";

    const mensajes = await mensajesDe(dto);

    expect(mensajes).toContain("El correo electrónico no es válido.");
    expect(mensajes).toContain("La contraseña es obligatoria.");
  });

  it("ForgotPasswordDto: email inválido produce mensaje ES", async () => {
    const dto = new ForgotPasswordDto();
    dto.email = "invalido";

    const mensajes = await mensajesDe(dto);

    expect(mensajes).toContain("El correo electrónico no es válido.");
  });

  it("ResetPasswordDto: token vacío y password corta producen mensajes ES", async () => {
    const dto = new ResetPasswordDto();
    dto.token = "";
    dto.passwordNueva = "corta";

    const mensajes = await mensajesDe(dto);

    expect(mensajes).toContain("El token es obligatorio.");
    expect(mensajes).toContain("La contraseña debe tener al menos 8 caracteres.");
  });

  it("CrearUsuarioDto: rol inválido produce mensaje ES", async () => {
    const dto = new CrearUsuarioDto();
    dto.nombre = "Ana";
    dto.email = "ana@arrendadora.com";
    // @ts-expect-error -- valor inválido intencional para probar el mensaje
    dto.rol = "superadmin";

    const mensajes = await mensajesDe(dto);

    expect(mensajes).toContain("El rol seleccionado no es válido.");
  });

  it("CambiarEstadoDto: acción inválida produce mensaje ES", async () => {
    const dto = new CambiarEstadoDto();
    // @ts-expect-error -- valor inválido intencional para probar el mensaje
    dto.accion = "eliminar";

    const mensajes = await mensajesDe(dto);

    expect(mensajes).toContain("La acción solicitada no es válida.");
  });

  it("todos los mensajes visibles usan caracteres del español (acentos donde aplica)", async () => {
    const login = new LoginDto();
    login.email = "x";
    login.password = "";
    const mensajes = await mensajesDe(login);

    // Ningún mensaje debe estar vacío ni ser el default en inglés de class-validator.
    for (const mensaje of mensajes) {
      expect(mensaje.length).toBeGreaterThan(0);
      expect(mensaje).not.toMatch(/must be|should not|is not a valid/i);
    }
  });
});
