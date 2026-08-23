import { describe, expect, it } from "vitest";
import { puedeGestionarMultimedia } from "./acceso-multimedia";
import type { Actor } from "../types/rol-actor";

/** RN-010 / RN-011 — alcance de un actor sobre la multimedia de una propiedad (ADR-014). */
describe("puedeGestionarMultimedia", () => {
  const admin: Actor = { id: "u-admin", rol: "administrador" };
  const editor: Actor = { id: "u-editor", rol: "editor" };
  const agente: Actor = { id: "u-agente", rol: "agente" };

  it("Administrador gestiona la multimedia de cualquier propiedad", () => {
    expect(puedeGestionarMultimedia(admin, "otro-agente")).toBe(true);
    expect(puedeGestionarMultimedia(admin, null)).toBe(true);
  });

  it("Editor gestiona la multimedia de cualquier propiedad", () => {
    expect(puedeGestionarMultimedia(editor, "otro-agente")).toBe(true);
    expect(puedeGestionarMultimedia(editor, null)).toBe(true);
  });

  it("Agente solo gestiona la multimedia de sus propias propiedades (RN-010)", () => {
    expect(puedeGestionarMultimedia(agente, "u-agente")).toBe(true);
  });

  it("Agente no gestiona la multimedia de una propiedad de otro agente", () => {
    expect(puedeGestionarMultimedia(agente, "otro-agente")).toBe(false);
  });

  it("Agente no gestiona la multimedia de una propiedad sin agente asignado", () => {
    expect(puedeGestionarMultimedia(agente, null)).toBe(false);
  });
});
