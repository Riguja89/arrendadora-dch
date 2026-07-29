import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "./http-client";
import { cambiarPassword, restablecerPassword, solicitarRecuperacionPassword } from "./password-api";

/**
 * Cubre el shape de las peticiones contra los flujos de contraseña (DESIGN-028, CU-002 +
 * GAP-004). Mismo criterio de mocking que `usuarios-api.spec.ts`.
 */

describe("solicitarRecuperacionPassword", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({}) }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace POST a /auth/forgot-password con el email (CU-002 paso 3)", async () => {
    await solicitarRecuperacionPassword({ email: "usuario@inmobiliaria.com" });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/forgot-password`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: "usuario@inmobiliaria.com" }),
      }),
    );
  });
});

describe("restablecerPassword", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace POST a /auth/reset-password con token + password_nueva (CU-002 paso 9-10)", async () => {
    await restablecerPassword({ token: "token-123", password_nueva: "Segura123" });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/reset-password`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ token: "token-123", password_nueva: "Segura123" }),
      }),
    );
  });
});

describe("cambiarPassword", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace POST a /auth/change-password con password_actual + password_nueva (GAP-004)", async () => {
    await cambiarPassword({ password_actual: "Temporal123", password_nueva: "Segura123" });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/change-password`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ password_actual: "Temporal123", password_nueva: "Segura123" }),
      }),
    );
  });
});
