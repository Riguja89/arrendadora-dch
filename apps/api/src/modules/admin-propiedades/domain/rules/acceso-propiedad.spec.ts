import { describe, expect, it } from "vitest";
import { puedeOperarSobrePropiedad } from "./acceso-propiedad";
import type { Actor } from "../types/rol-actor";

/** RN-010 / RN-011 — alcance de un actor sobre una propiedad concreta (ADR-014). */
describe("puedeOperarSobrePropiedad", () => {
  const admin: Actor = { id: "u-admin", rol: "administrador" };
  const editor: Actor = { id: "u-editor", rol: "editor" };
  const agente: Actor = { id: "u-agente", rol: "agente" };

  it("Administrador opera sobre cualquier propiedad (RN-011)", () => {
    expect(puedeOperarSobrePropiedad(admin, "otro-agente")).toBe(true);
    expect(puedeOperarSobrePropiedad(admin, null)).toBe(true);
  });

  it("Editor opera sobre cualquier propiedad", () => {
    expect(puedeOperarSobrePropiedad(editor, "otro-agente")).toBe(true);
    expect(puedeOperarSobrePropiedad(editor, null)).toBe(true);
  });

  it("Agente solo opera sobre sus propias propiedades (RN-010)", () => {
    expect(puedeOperarSobrePropiedad(agente, "u-agente")).toBe(true);
  });

  it("Agente no opera sobre propiedades de otro agente", () => {
    expect(puedeOperarSobrePropiedad(agente, "otro-agente")).toBe(false);
  });

  it("Agente no opera sobre una propiedad sin agente asignado", () => {
    expect(puedeOperarSobrePropiedad(agente, null)).toBe(false);
  });
});
