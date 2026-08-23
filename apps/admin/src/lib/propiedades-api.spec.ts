import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "./http-client";
import { construirQueryPropiedades, duplicarPropiedad, listarPropiedades } from "./propiedades-api";
import type { Propiedad } from "./propiedades-types";

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

describe("duplicarPropiedad", () => {
  const copia: Propiedad = {
    id: "prop-copia-id",
    codigo: "PROP-0099",
    titulo: "Apartamento Chapinero",
    slug: "apartamento-chapinero-0099",
    descripcion: "Copia de una propiedad existente",
    tipo_operacion: "arriendo",
    tipo_propiedad_id: "tipo-1",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    direccion: null,
    precio: 2500000,
    area: 65,
    habitaciones: 2,
    banos: 1,
    estrato: 4,
    parqueaderos: 1,
    estado: "disponible",
    destacada: false,
    archivada: false,
    agente_id: "agente-1",
    latitud: null,
    longitud: null,
    amenidades: [{ amenidad_id: "am-1", nombre: "Piscina", cantidad: 1 }],
    fotos: [],
    publicada_en: null,
    created_at: "2026-07-28T00:00:00.000Z",
    updated_at: "2026-07-28T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => copia,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace POST a /admin/propiedades/{id}/duplicar sin body (RN-026 — el backend copia los campos, no el cliente)", async () => {
    await duplicarPropiedad("prop-original-id");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/propiedades/prop-original-id/duplicar`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: undefined,
        headers: undefined,
      }),
    );
  });

  it("propaga la copia devuelta por el backend, siempre en estado disponible y sin fotos", async () => {
    const resultado = await duplicarPropiedad("prop-original-id");

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.data.id).not.toBe("prop-original-id");
    expect(resultado.data.estado).toBe("disponible");
    expect(resultado.data.fotos).toEqual([]);
  });
});
