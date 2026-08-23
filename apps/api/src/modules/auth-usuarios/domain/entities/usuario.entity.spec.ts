import { describe, expect, it } from "vitest";
import { Usuario, type UsuarioProps } from "./usuario.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function props(overrides: Partial<UsuarioProps> = {}): UsuarioProps {
  return {
    id: "user-1",
    nombre: "Ana Pérez",
    email: "ana@arrendadora.com",
    passwordHash: "hash-1",
    rol: "agente",
    estado: "activo",
    whatsapp: null,
    intentosFallidos: 0,
    requiereCambioPassword: false,
    createdAt: AHORA,
    updatedAt: AHORA,
    ...overrides,
  };
}

describe("Usuario", () => {
  describe("crear", () => {
    it("arranca activo, sin intentos fallidos y con requiereCambioPassword=true (GAP-004 opción A)", () => {
      const usuario = Usuario.crear({
        id: "user-1",
        nombre: "Ana Pérez",
        email: "ana@arrendadora.com",
        passwordHash: "hash-1",
        rol: "editor",
        whatsapp: "+50588887777",
        ahora: AHORA,
      });

      expect(usuario.estado).toBe("activo");
      expect(usuario.intentosFallidos).toBe(0);
      expect(usuario.requiereCambioPassword).toBe(true);
      expect(usuario.rol).toBe("editor");
      expect(usuario.whatsapp).toBe("+50588887777");
      expect(usuario.createdAt).toEqual(AHORA);
      expect(usuario.updatedAt).toEqual(AHORA);
    });
  });

  describe("reconstituir", () => {
    it("restaura la instancia sin validar invariantes de creación", () => {
      const usuario = Usuario.reconstituir(props({ estado: "bloqueado", intentosFallidos: 5 }));
      expect(usuario.estado).toBe("bloqueado");
      expect(usuario.intentosFallidos).toBe(5);
    });
  });

  describe("predicados de estado", () => {
    it("estaActivo/estaBloqueado/estaDesactivado reflejan el estado actual", () => {
      const activo = Usuario.reconstituir(props({ estado: "activo" }));
      expect(activo.estaActivo()).toBe(true);
      expect(activo.estaBloqueado()).toBe(false);
      expect(activo.estaDesactivado()).toBe(false);

      const bloqueado = Usuario.reconstituir(props({ estado: "bloqueado" }));
      expect(bloqueado.estaBloqueado()).toBe(true);
      expect(bloqueado.estaActivo()).toBe(false);

      const desactivado = Usuario.reconstituir(props({ estado: "desactivado" }));
      expect(desactivado.estaDesactivado()).toBe(true);
      expect(desactivado.estaActivo()).toBe(false);
    });
  });

  describe("registrarIntentoFallido", () => {
    it("incrementa el contador sin bloquear si no llega al máximo", () => {
      const usuario = Usuario.reconstituir(props({ intentosFallidos: 2 }));
      const despues = new Date(AHORA.getTime() + 1000);

      usuario.registrarIntentoFallido(5, despues);

      expect(usuario.intentosFallidos).toBe(3);
      expect(usuario.estaActivo()).toBe(true);
      expect(usuario.updatedAt).toEqual(despues);
    });

    it("bloquea la cuenta al alcanzar el máximo de intentos (GAP-006/ADR-004)", () => {
      const usuario = Usuario.reconstituir(props({ intentosFallidos: 4 }));

      usuario.registrarIntentoFallido(5, AHORA);

      expect(usuario.intentosFallidos).toBe(5);
      expect(usuario.estaBloqueado()).toBe(true);
    });

    it("no desbloquea si ya estaba bloqueado y sigue fallando por encima del máximo", () => {
      const usuario = Usuario.reconstituir(props({ intentosFallidos: 5, estado: "bloqueado" }));

      usuario.registrarIntentoFallido(5, AHORA);

      expect(usuario.intentosFallidos).toBe(6);
      expect(usuario.estaBloqueado()).toBe(true);
    });
  });

  describe("registrarIntentoExitoso", () => {
    it("resetea el contador de intentos fallidos", () => {
      const usuario = Usuario.reconstituir(props({ intentosFallidos: 3 }));
      const despues = new Date(AHORA.getTime() + 2000);

      usuario.registrarIntentoExitoso(despues);

      expect(usuario.intentosFallidos).toBe(0);
      expect(usuario.updatedAt).toEqual(despues);
    });
  });

  describe("activar/desactivar/desbloquear", () => {
    it("activar() reactiva un usuario desactivado (CU-004 3b)", () => {
      const usuario = Usuario.reconstituir(props({ estado: "desactivado" }));
      usuario.activar(AHORA);
      expect(usuario.estado).toBe("activo");
    });

    it("desactivar() marca al usuario como desactivado (RN-037)", () => {
      const usuario = Usuario.reconstituir(props({ estado: "activo" }));
      usuario.desactivar(AHORA);
      expect(usuario.estado).toBe("desactivado");
    });

    it("desbloquear() reactiva y resetea el contador de intentos (ADR-004)", () => {
      const usuario = Usuario.reconstituir(props({ estado: "bloqueado", intentosFallidos: 5 }));
      usuario.desbloquear(AHORA);
      expect(usuario.estado).toBe("activo");
      expect(usuario.intentosFallidos).toBe(0);
    });
  });

  describe("cambiarPassword", () => {
    it("actualiza el hash y limpia el flag de cambio obligatorio", () => {
      const usuario = Usuario.reconstituir(props({ passwordHash: "hash-viejo", requiereCambioPassword: true }));
      const despues = new Date(AHORA.getTime() + 5000);

      usuario.cambiarPassword("hash-nuevo", despues);

      expect(usuario.passwordHash).toBe("hash-nuevo");
      expect(usuario.requiereCambioPassword).toBe(false);
      expect(usuario.updatedAt).toEqual(despues);
    });
  });

  describe("editarPerfil", () => {
    it("actualiza solo los campos provistos (email no editable)", () => {
      const usuario = Usuario.reconstituir(
        props({ nombre: "Original", rol: "editor", whatsapp: "+123" }),
      );

      usuario.editarPerfil({ nombre: "Nuevo Nombre" }, AHORA);

      expect(usuario.nombre).toBe("Nuevo Nombre");
      expect(usuario.rol).toBe("editor");
      expect(usuario.whatsapp).toBe("+123");
    });

    it("permite fijar whatsapp en null explícitamente", () => {
      const usuario = Usuario.reconstituir(props({ whatsapp: "+123" }));
      usuario.editarPerfil({ whatsapp: null }, AHORA);
      expect(usuario.whatsapp).toBeNull();
    });

    it("actualiza el rol cuando se provee", () => {
      const usuario = Usuario.reconstituir(props({ rol: "agente" }));
      usuario.editarPerfil({ rol: "administrador" }, AHORA);
      expect(usuario.rol).toBe("administrador");
    });
  });

  describe("toProps", () => {
    it("retorna una copia con todos los campos actuales", () => {
      const base = props();
      const usuario = Usuario.reconstituir(base);
      expect(usuario.toProps()).toEqual(base);
    });
  });
});
