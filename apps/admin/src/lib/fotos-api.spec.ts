import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "./http-client";
import { cargarFotos, eliminarFoto, marcarFotoPortada, reordenarFotos } from "./fotos-api";

/**
 * Cubre el shape de las peticiones contra `/admin/propiedades/{id}/fotos*` (DESIGN-028,
 * spec-004). Mismo criterio que `propiedades-api.spec.ts`: se mockea `fetch` y se verifica
 * método, path y body — no se re-testea el envelope de error (ya cubierto en `http-client.spec.ts`).
 */

function mockFetchOk(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status, json: async () => body }),
  );
}

describe("cargarFotos", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hace POST multipart a /admin/propiedades/{id}/fotos con el campo 'archivos'", async () => {
    mockFetchOk({ cargadas: [], rechazadas: [] }, 207);
    const archivo = new File(["x"], "foto.jpg", { type: "image/jpeg" });

    await cargarFotos("prop-1", [archivo]);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/admin/propiedades/prop-1/fotos`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).getAll("archivos")).toEqual([archivo]);
  });
});

describe("reordenarFotos", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hace PATCH a /admin/propiedades/{id}/fotos/orden con la lista de IDs", async () => {
    mockFetchOk([]);

    await reordenarFotos("prop-1", ["f2", "f1", "f3"]);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/admin/propiedades/prop-1/fotos/orden`);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ orden: ["f2", "f1", "f3"] }));
  });
});

describe("marcarFotoPortada", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hace PATCH a /admin/propiedades/{id}/fotos/{fotoId}/portada", async () => {
    mockFetchOk([]);

    await marcarFotoPortada("prop-1", "foto-9");

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/admin/propiedades/prop-1/fotos/foto-9/portada`);
    expect(init.method).toBe("PATCH");
  });
});

describe("eliminarFoto", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hace DELETE al mismo path de portada (contrato DESIGN-028, ver nota en fotos-api.ts)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() }));

    await eliminarFoto("prop-1", "foto-9");

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/admin/propiedades/prop-1/fotos/foto-9/portada`);
    expect(init.method).toBe("DELETE");
  });
});
