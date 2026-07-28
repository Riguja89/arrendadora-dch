import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RespuestaError } from "@arrendadora/shared";
import { API_BASE_URL, onUnauthorized, peticionApi } from "./http-client";

/**
 * Cubre el contrato de `peticionApi()`: `credentials: "include"` (sesión por cookie `sid`,
 * ADR-004), parseo del envelope de error (ADR-015) y la señal `onUnauthorized()` que dispara
 * `auth-context.tsx` para cerrar sesión localmente cuando el `sid` expiró.
 */

function respuestaFalsa(init: { ok: boolean; status: number; body?: unknown }): Response {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => init.body,
  } as unknown as Response;
}

describe("http-client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resuelve un API_BASE_URL por default", () => {
    expect(API_BASE_URL).toMatch(/^https?:\/\//);
  });

  it("arma la petición con credentials include, siempre", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: true, status: 200, body: { id: "1" } }));

    await peticionApi("/admin/propiedades");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/propiedades`,
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("serializa el body y agrega Content-Type solo cuando hay body", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: true, status: 200, body: {} }));

    await peticionApi("/auth/login", { method: "POST", body: { email: "a@b.com", password: "x" } });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ email: "a@b.com", password: "x" }));
  });

  it("una petición GET sin body no agrega headers", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: true, status: 200, body: [] }));

    await peticionApi("/admin/propiedades");

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("una respuesta 2xx con JSON retorna ok:true con la data", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: true, status: 200, body: { id: "abc" } }));

    const resultado = await peticionApi<{ id: string }>("/admin/propiedades/abc");

    expect(resultado).toEqual({ ok: true, data: { id: "abc" } });
  });

  it("una respuesta 204 retorna ok:true con data undefined, sin parsear body", async () => {
    const json = vi.fn();
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204, json } as unknown as Response);

    const resultado = await peticionApi("/auth/logout", { method: "POST" });

    expect(resultado).toEqual({ ok: true, data: undefined });
    expect(json).not.toHaveBeenCalled();
  });

  it("una respuesta de error con envelope válido retorna ok:false con ese error", async () => {
    const error: RespuestaError = {
      error: "UNAUTHENTICATED",
      message: "Email o contraseña incorrectos.",
      correlation_id: "corr-1",
    };
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: false, status: 401, body: error }));

    const resultado = await peticionApi("/auth/login", { method: "POST", body: {} });

    expect(resultado).toEqual({ ok: false, error });
  });

  it("una respuesta de error sin envelope válido cae a un error genérico", async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaFalsa({ ok: false, status: 500, body: { inesperado: true } }));

    const resultado = await peticionApi("/admin/propiedades");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("INTERNAL_ERROR");
      expect(resultado.error.correlation_id).toBeTruthy();
    }
  });

  it("un fallo de red (fetch rechaza) retorna ok:false con SERVICE_UNAVAILABLE", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const resultado = await peticionApi("/admin/propiedades");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("SERVICE_UNAVAILABLE");
    }
  });

  it("un 401 en una ruta protegida dispara los handlers de onUnauthorized", async () => {
    const handler = vi.fn();
    const desuscribir = onUnauthorized(handler);
    vi.mocked(fetch).mockResolvedValue(
      respuestaFalsa({
        ok: false,
        status: 401,
        body: { error: "UNAUTHENTICATED", message: "Sesión vencida.", correlation_id: "c" },
      }),
    );

    await peticionApi("/admin/propiedades");

    expect(handler).toHaveBeenCalledTimes(1);
    desuscribir();
  });

  it("un 401 en /auth/login NO dispara los handlers de onUnauthorized (credenciales inválidas)", async () => {
    const handler = vi.fn();
    const desuscribir = onUnauthorized(handler);
    vi.mocked(fetch).mockResolvedValue(
      respuestaFalsa({
        ok: false,
        status: 401,
        body: { error: "UNAUTHENTICATED", message: "Email o contraseña incorrectos.", correlation_id: "c" },
      }),
    );

    await peticionApi("/auth/login", { method: "POST", body: {} });

    expect(handler).not.toHaveBeenCalled();
    desuscribir();
  });

  it("onUnauthorized() retorna una función de desuscripción efectiva", async () => {
    const handler = vi.fn();
    const desuscribir = onUnauthorized(handler);
    desuscribir();

    vi.mocked(fetch).mockResolvedValue(
      respuestaFalsa({
        ok: false,
        status: 401,
        body: { error: "UNAUTHENTICATED", message: "Sesión vencida.", correlation_id: "c" },
      }),
    );

    await peticionApi("/admin/propiedades");

    expect(handler).not.toHaveBeenCalled();
  });
});
