import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "./http-client";
import { cambiarEstadoUsuario, construirQueryUsuarios, crearUsuario, editarUsuario, listarUsuarios } from "./usuarios-api";

/**
 * Cubre el query-string builder de filtros (lógica pura) y el shape de las peticiones contra
 * `/admin/usuarios*` (DESIGN-028, spec-005 CU-003/CU-004).
 */

describe("construirQueryUsuarios", () => {
  it("retorna string vacío sin filtros", () => {
    expect(construirQueryUsuarios({})).toBe("");
  });

  it("incluye solo los filtros presentes", () => {
    expect(construirQueryUsuarios({ estado: "activo" })).toBe("?estado=activo");
  });

  it("arma múltiples filtros combinados", () => {
    const query = construirQueryUsuarios({ estado: "desactivado", rol: "agente", pagina: 2, tamano_pagina: 10 });
    expect(query).toContain("estado=desactivado");
    expect(query).toContain("rol=agente");
    expect(query).toContain("pagina=2");
    expect(query).toContain("tamano_pagina=10");
  });
});

describe("listarUsuarios", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: { pagina: 1, tamano_pagina: 20, total: 0, total_paginas: 1 } }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace GET a /admin/usuarios con los filtros como query string", async () => {
    await listarUsuarios({ estado: "activo", pagina: 2 });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/usuarios?estado=activo&pagina=2`,
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("sin filtros, pega a /admin/usuarios sin query string", async () => {
    await listarUsuarios();

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/usuarios`, expect.anything());
  });

  it("propaga el bloque `meta` anidado tal como lo devuelve el backend", async () => {
    const resultado = await listarUsuarios();
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.data.meta).toEqual({ pagina: 1, tamano_pagina: 20, total: 0, total_paginas: 1 });
  });
});

describe("crearUsuario", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: "usuario-1",
          nombre: "María García",
          email: "mgarcia@inmobiliaria.com",
          rol: "agente",
          estado: "activo",
          whatsapp: "+57 310 500 1234",
          requiere_cambio_password: true,
          created_at: "2026-07-28T00:00:00.000Z",
          updated_at: "2026-07-28T00:00:00.000Z",
          password_temporal: "Temp1234",
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace POST a /admin/usuarios con el payload (HU-003)", async () => {
    await crearUsuario({ nombre: "María García", email: "mgarcia@inmobiliaria.com", rol: "agente", whatsapp: "+57 310 500 1234" });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/usuarios`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ nombre: "María García", email: "mgarcia@inmobiliaria.com", rol: "agente", whatsapp: "+57 310 500 1234" }),
      }),
    );
  });

  it("propaga la contraseña temporal devuelta por el backend (GAP-004)", async () => {
    const resultado = await crearUsuario({ nombre: "María García", email: "mgarcia@inmobiliaria.com", rol: "agente" });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.data.password_temporal).toBe("Temp1234");
  });
});

describe("editarUsuario", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "usuario-1",
          nombre: "María García Actualizada",
          email: "mgarcia@inmobiliaria.com",
          rol: "agente",
          estado: "activo",
          whatsapp: null,
          requiere_cambio_password: false,
          created_at: "2026-07-28T00:00:00.000Z",
          updated_at: "2026-07-28T00:00:00.000Z",
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace PUT a /admin/usuarios/{id} — el email no forma parte del payload (CU-004)", async () => {
    await editarUsuario("usuario-1", { nombre: "María García Actualizada", rol: "agente", whatsapp: null });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/usuarios/usuario-1`,
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ nombre: "María García Actualizada", rol: "agente", whatsapp: null }),
      }),
    );
  });
});

describe("cambiarEstadoUsuario", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "usuario-1",
          nombre: "Juan Rodríguez",
          email: "jrodriguez@inmobiliaria.com",
          rol: "agente",
          estado: "desactivado",
          whatsapp: null,
          requiere_cambio_password: false,
          created_at: "2026-07-28T00:00:00.000Z",
          updated_at: "2026-07-28T00:00:00.000Z",
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hace PATCH a /admin/usuarios/{id}/estado con la acción (HU-004)", async () => {
    await cambiarEstadoUsuario("usuario-1", "desactivar");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/usuarios/usuario-1/estado`,
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ accion: "desactivar" }),
      }),
    );
  });
});
