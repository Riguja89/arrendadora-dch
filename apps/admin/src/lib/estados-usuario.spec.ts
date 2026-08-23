import { describe, expect, it } from "vitest";
import { accionDisponible, mensajeConfirmacionAccion } from "./estados-usuario";

describe("accionDisponible", () => {
  it("activo → desactivar", () => {
    expect(accionDisponible("activo")).toBe("desactivar");
  });

  it("desactivado → activar", () => {
    expect(accionDisponible("desactivado")).toBe("activar");
  });

  it("bloqueado → desbloquear", () => {
    expect(accionDisponible("bloqueado")).toBe("desbloquear");
  });
});

describe("mensajeConfirmacionAccion", () => {
  it("incluye el nombre del usuario en el mensaje de desactivación (HU-004 escenario 1)", () => {
    expect(mensajeConfirmacionAccion("desactivar", "Juan Rodríguez")).toContain("Juan Rodríguez");
  });

  it("incluye el nombre del usuario en el mensaje de activación (HU-004 escenario 2)", () => {
    expect(mensajeConfirmacionAccion("activar", "Juan Rodríguez")).toContain("Juan Rodríguez");
  });

  it("produce un mensaje distinto para desbloquear", () => {
    expect(mensajeConfirmacionAccion("desbloquear", "Juan Rodríguez")).toContain("Desbloquear");
  });
});
