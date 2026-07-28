import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "./http-client";
import { construirQueryPropiedades, listarPropiedades } from "./propiedades-api";

/**
 * Cubre el query-string builder de filtros (lógica pura) y el shape de la petición de
 * `listarPropiedades` contra `/admin/propiedades` (DESIGN-028, spec-003 CU-005/HU-004).
 */

describe("construirQueryPropiedades", () => {
  it("retorna string vacío sin filtros", () => {
    expect(construirQueryPropiedades({})).toBe("");
  });

  it("incluye solo los filtros presentes", () => {
    expect(construirQueryPropiedades({ estado: "disponible" })).toBe("?estado=disponible");
  });

  it("arma múltiples filtros combinados", () => {
    const query = construirQueryPropiedades({
      estado: "reservada",
      tipo_operacion: "arriendo",
      pagina: 2,
      tamano_pagina: 10,
    });
    expect(query).toContain("estado=reservada");
    expect(query).toContain("tipo_operacion=arriendo");
    expect(query).toContain("pagina=2");
    expect(query).toContain("tamano_pagina=10");
  });

  it("recorta espacios y omite `q` vacío", () => {
    expect(construirQueryPropiedades({ q: "   " })).toBe("");
    expect(construirQueryPropiedades({ q: "  Chapinero  " })).toBe("?q=Chapinero");
  });

  it("serializa `archivada` como string booleano (incluye el caso false explícito)", () => {
    expect(construirQueryPropiedades({ archivada: false })).toBe("?archivada=false");
    expect(construirQueryPropiedades({ archivada: true })).toBe("?archivada=true");
  });

  it("incluye el filtro de agente (uuid o 'me')", () => {
    expect(construirQueryPropiedades({ agente: "me" })).toBe("?agente=me");
  });
});

describe("listarPropiedades", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagina: 1, tamano_pagina: 20, total: 0, total_paginas: 1 }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace GET a /admin/propiedades con los filtros como query string", async () => {
    await listarPropiedades({ estado: "disponible", pagina: 2 });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/propiedades?estado=disponible&pagina=2`,
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("sin filtros, pega a /admin/propiedades sin query string", async () => {
    await listarPropiedades();

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/propiedades`, expect.anything());
  });
});
