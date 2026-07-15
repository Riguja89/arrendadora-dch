import { describe, expect, it } from "vitest";
import { API_BASE_URL, peticionApi } from "./http-client";

/**
 * Smoke test de scaffolding — confirma el shape del cliente HTTP base sin ejercitar fetch
 * real. Se reemplaza por tests contra mocks de red al implementar auth-usuarios.
 */
describe("http-client (smoke — scaffolding)", () => {
  it("resuelve un API_BASE_URL por default", () => {
    expect(API_BASE_URL).toMatch(/^https?:\/\//);
  });

  it("peticionApi() lanza porque todavía no hay implementación real", async () => {
    await expect(peticionApi("/admin/propiedades")).rejects.toThrow(/no implementado/);
  });
});
