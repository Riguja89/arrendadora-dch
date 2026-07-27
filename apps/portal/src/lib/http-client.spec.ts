import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, peticionApi, peticionApiPost } from "./http-client";

function mockFetchOnce(response: Partial<Response> & { json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("peticionApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("usa http://localhost:3000/v1 como base por defecto", () => {
    expect(API_BASE_URL).toBe("http://localhost:3000/v1");
  });

  it("devuelve { ok: true, data } cuando la respuesta es 2xx", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      json: async () => ({ data: ["propiedad-1"] }),
    });

    const resultado = await peticionApi<{ data: string[] }>("/public/propiedades");

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/public/propiedades`,
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(resultado).toEqual({ ok: true, data: { data: ["propiedad-1"] } });
  });

  it("devuelve { ok: false, error } con el envelope ADR-015 cuando la respuesta no es 2xx", async () => {
    mockFetchOnce({
      ok: false,
      json: async () => ({
        error: "NOT_FOUND",
        message: "La propiedad solicitada no está disponible.",
        correlation_id: "11111111-1111-1111-1111-111111111111",
      }),
    });

    const resultado = await peticionApi("/public/propiedades/slug-inexistente");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("NOT_FOUND");
      expect(resultado.error.correlation_id).toBe("11111111-1111-1111-1111-111111111111");
    }
  });

  it("sintetiza un error INTERNAL_ERROR si el body no-2xx no es JSON válido", async () => {
    mockFetchOnce({
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    const resultado = await peticionApi("/public/propiedades");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("INTERNAL_ERROR");
      expect(resultado.error.correlation_id).toBeTruthy();
    }
  });

  it("normaliza excepciones de red (fetch rechazado) a SERVICE_UNAVAILABLE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const resultado = await peticionApi("/public/propiedades");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("SERVICE_UNAVAILABLE");
    }
  });
});

describe("peticionApiPost", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("envía method POST con Content-Type JSON y el body serializado", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      json: async () => ({ deep_link: "https://wa.me/573001234567?text=Hola" }),
    });

    const resultado = await peticionApiPost<{ deep_link: string }>(
      "/public/propiedades/ap-001/contacto-whatsapp",
      { recaptcha_token: "token-123" },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/public/propiedades/ap-001/contacto-whatsapp`,
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ recaptcha_token: "token-123" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(resultado).toEqual({ ok: true, data: { deep_link: "https://wa.me/573001234567?text=Hola" } });
  });

  it("devuelve { ok: false, error } con el envelope ADR-015 en un 403 (anti-bot rechazó, ADR-007)", async () => {
    mockFetchOnce({
      ok: false,
      json: async () => ({
        error: "FORBIDDEN",
        message: "No pudimos validar tu solicitud. Por favor intentá de nuevo.",
        correlation_id: "22222222-2222-2222-2222-222222222222",
      }),
    });

    const resultado = await peticionApiPost("/public/propiedades/ap-001/contacto-whatsapp", {
      recaptcha_token: "token-rechazado",
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("FORBIDDEN");
    }
  });

  it("normaliza excepciones de red a SERVICE_UNAVAILABLE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const resultado = await peticionApiPost("/public/propiedades/ap-001/contacto-whatsapp", {
      recaptcha_token: "token-123",
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("SERVICE_UNAVAILABLE");
    }
  });
});
