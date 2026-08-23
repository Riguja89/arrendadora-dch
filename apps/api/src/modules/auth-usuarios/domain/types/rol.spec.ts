import { describe, expect, it } from "vitest";
import { esRolValido, puedeGestionarUsuarios, ROLES_VALIDOS } from "./rol";

describe("esRolValido", () => {
  it.each(ROLES_VALIDOS)("acepta el rol válido: %s", (rol) => {
    expect(esRolValido(rol)).toBe(true);
  });

  it("rechaza un rol desconocido", () => {
    expect(esRolValido("superadmin")).toBe(false);
  });

  it("rechaza cadena vacía", () => {
    expect(esRolValido("")).toBe(false);
  });
});

describe("puedeGestionarUsuarios (ADR-014)", () => {
  it("retorna true solo para administrador", () => {
    expect(puedeGestionarUsuarios("administrador")).toBe(true);
  });

  it("retorna false para agente", () => {
    expect(puedeGestionarUsuarios("agente")).toBe(false);
  });

  it("retorna false para editor", () => {
    expect(puedeGestionarUsuarios("editor")).toBe(false);
  });
});
