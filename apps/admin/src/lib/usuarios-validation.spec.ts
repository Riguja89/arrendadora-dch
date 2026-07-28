import { describe, expect, it } from "vitest";
import {
  construirPayloadCrearUsuario,
  construirPayloadEditarUsuario,
  mapearErroresValidacionUsuario,
  valoresInicialesUsuario,
  validarFormularioUsuario,
  type UsuarioFormValues,
} from "./usuarios-validation";
import type { Usuario } from "@arrendadora/shared";

function valoresValidos(overrides: Partial<UsuarioFormValues> = {}): UsuarioFormValues {
  return {
    nombre: "María García",
    email: "mgarcia@inmobiliaria.com",
    rol: "agente",
    whatsapp: "+57 310 500 1234",
    ...overrides,
  };
}

const usuarioBase: Usuario = {
  id: "usuario-1",
  nombre: "María García",
  email: "mgarcia@inmobiliaria.com",
  rol: "agente",
  estado: "activo",
  whatsapp: "+57 310 500 1234",
  requiere_cambio_password: false,
  created_at: "2026-07-28T00:00:00.000Z",
  updated_at: "2026-07-28T00:00:00.000Z",
};

describe("validarFormularioUsuario", () => {
  it("acepta valores válidos", () => {
    const resultado = validarFormularioUsuario(valoresValidos());
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toEqual({});
  });

  it("exige nombre", () => {
    const resultado = validarFormularioUsuario(valoresValidos({ nombre: "  " }));
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.nombre).toBeDefined();
  });

  it("exige email", () => {
    const resultado = validarFormularioUsuario(valoresValidos({ email: "" }));
    expect(resultado.errores.email).toBe("El correo electrónico es obligatorio.");
  });

  it("rechaza un email con formato inválido", () => {
    const resultado = validarFormularioUsuario(valoresValidos({ email: "no-es-un-email" }));
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.email).toBeDefined();
  });

  it("exige rol", () => {
    const resultado = validarFormularioUsuario(valoresValidos({ rol: "" }));
    expect(resultado.errores.rol).toBe("Seleccioná un rol.");
  });

  it("NO exige WhatsApp para rol Agente (RN-038 superseded por GAP-002 Modelo B)", () => {
    const resultado = validarFormularioUsuario(valoresValidos({ rol: "agente", whatsapp: "" }));
    expect(resultado.valido).toBe(true);
    expect(resultado.errores.whatsapp).toBeUndefined();
  });
});

describe("construirPayloadCrearUsuario", () => {
  it("arma el payload UsuarioCrear recortando espacios", () => {
    const payload = construirPayloadCrearUsuario(valoresValidos({ nombre: "  María García  " }));
    expect(payload).toEqual({
      nombre: "María García",
      email: "mgarcia@inmobiliaria.com",
      rol: "agente",
      whatsapp: "+57 310 500 1234",
    });
  });

  it("envía whatsapp null si el campo quedó vacío", () => {
    const payload = construirPayloadCrearUsuario(valoresValidos({ whatsapp: "   " }));
    expect(payload.whatsapp).toBeNull();
  });
});

describe("construirPayloadEditarUsuario", () => {
  it("arma el payload UsuarioEditar sin campo email (CU-004 — no editable)", () => {
    const payload = construirPayloadEditarUsuario(valoresValidos());
    expect(payload).toEqual({
      nombre: "María García",
      rol: "agente",
      whatsapp: "+57 310 500 1234",
    });
    expect(payload).not.toHaveProperty("email");
  });
});

describe("valoresInicialesUsuario", () => {
  it("retorna valores vacíos sin usuario (modo crear)", () => {
    expect(valoresInicialesUsuario()).toEqual({ nombre: "", email: "", rol: "", whatsapp: "" });
  });

  it("prellena valores desde el usuario (modo editar)", () => {
    expect(valoresInicialesUsuario(usuarioBase)).toEqual({
      nombre: "María García",
      email: "mgarcia@inmobiliaria.com",
      rol: "agente",
      whatsapp: "+57 310 500 1234",
    });
  });

  it("usa string vacío si whatsapp es null", () => {
    const resultado = valoresInicialesUsuario({ ...usuarioBase, whatsapp: null });
    expect(resultado.whatsapp).toBe("");
  });
});

describe("mapearErroresValidacionUsuario", () => {
  it("mapea detalles del 422 a errores por campo", () => {
    const errores = mapearErroresValidacionUsuario([{ campo: "email", mensaje: "El correo electrónico no es válido." }]);
    expect(errores).toEqual({ email: "El correo electrónico no es válido." });
  });

  it("retorna objeto vacío si no hay detalles", () => {
    expect(mapearErroresValidacionUsuario(undefined)).toEqual({});
  });
});
