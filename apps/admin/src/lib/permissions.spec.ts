import { describe, expect, it } from "vitest";
import { puedeGestionarConfiguracion, puedeGestionarUsuarios, tieneRolPermitido } from "./permissions";

describe("permissions (RBAC nav — ADR-014)", () => {
  it("tieneRolPermitido es true cuando el rol está en la lista permitida", () => {
    expect(tieneRolPermitido("administrador", ["administrador", "editor"])).toBe(true);
  });

  it("tieneRolPermitido es false cuando el rol no está en la lista", () => {
    expect(tieneRolPermitido("agente", ["administrador"])).toBe(false);
  });

  it("tieneRolPermitido es false cuando el rol es null (sin sesión)", () => {
    expect(tieneRolPermitido(null, ["administrador"])).toBe(false);
  });

  it.each(["administrador"] as const)("puedeGestionarUsuarios(%s) es true", (rol) => {
    expect(puedeGestionarUsuarios(rol)).toBe(true);
  });

  it.each(["agente", "editor"] as const)("puedeGestionarUsuarios(%s) es false", (rol) => {
    expect(puedeGestionarUsuarios(rol)).toBe(false);
  });

  it("puedeGestionarUsuarios(null) es false", () => {
    expect(puedeGestionarUsuarios(null)).toBe(false);
  });

  it.each(["administrador"] as const)("puedeGestionarConfiguracion(%s) es true", (rol) => {
    expect(puedeGestionarConfiguracion(rol)).toBe(true);
  });

  it.each(["agente", "editor"] as const)("puedeGestionarConfiguracion(%s) es false", (rol) => {
    expect(puedeGestionarConfiguracion(rol)).toBe(false);
  });
});
