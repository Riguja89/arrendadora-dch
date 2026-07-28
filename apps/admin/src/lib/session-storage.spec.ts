import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Usuario } from "@arrendadora/shared";
import { guardarSesionCache, leerSesionCache, limpiarSesionCache } from "./session-storage";

/** Fake mínimo de `Storage` — vitest corre en entorno `node`, sin `sessionStorage` real. */
class AlmacenamientoFalso implements Storage {
  private datos = new Map<string, string>();

  get length(): number {
    return this.datos.size;
  }

  clear(): void {
    this.datos.clear();
  }

  getItem(clave: string): string | null {
    return this.datos.has(clave) ? (this.datos.get(clave) ?? null) : null;
  }

  key(indice: number): string | null {
    return Array.from(this.datos.keys())[indice] ?? null;
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, valor);
  }
}

const usuarioValido: Usuario = {
  id: "u1",
  nombre: "María García",
  email: "mgarcia@inmobiliaria.com",
  rol: "agente",
  estado: "activo",
  whatsapp: null,
  requiere_cambio_password: false,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

describe("session-storage", () => {
  let almacen: AlmacenamientoFalso;

  beforeEach(() => {
    almacen = new AlmacenamientoFalso();
    vi.stubGlobal("sessionStorage", almacen);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("guarda y lee un usuario válido", () => {
    guardarSesionCache(usuarioValido);

    expect(leerSesionCache()).toEqual(usuarioValido);
  });

  it("retorna null si no hay nada guardado", () => {
    expect(leerSesionCache()).toBeNull();
  });

  it("retorna null ante JSON corrupto", () => {
    almacen.setItem("arrendadora_admin_sesion", "{esto no es json");

    expect(leerSesionCache()).toBeNull();
  });

  it("retorna null si el valor guardado no tiene el shape de Usuario", () => {
    almacen.setItem("arrendadora_admin_sesion", JSON.stringify({ foo: "bar" }));

    expect(leerSesionCache()).toBeNull();
  });

  it("limpiarSesionCache elimina la entrada", () => {
    guardarSesionCache(usuarioValido);

    limpiarSesionCache();

    expect(leerSesionCache()).toBeNull();
  });

  it("no lanza si sessionStorage no está disponible", () => {
    vi.stubGlobal("sessionStorage", undefined);

    expect(() => guardarSesionCache(usuarioValido)).not.toThrow();
    expect(leerSesionCache()).toBeNull();
    expect(() => limpiarSesionCache()).not.toThrow();
  });
});
