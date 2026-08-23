import { beforeEach, describe, expect, it, vi } from "vitest";
import { CambiarEstadoUsuarioUseCase } from "./cambiar-estado-usuario.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import {
  AccionEstadoInvalidaError,
  AutoproteccionAdministradorError,
  UsuarioNoEncontradoError,
} from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function usuario(id: string, estado: "activo" | "bloqueado" | "desactivado") {
  return Usuario.reconstituir({
    id,
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash",
    rol: "agente",
    estado,
    whatsapp: null,
    intentosFallidos: estado === "bloqueado" ? 5 : 0,
    requiereCambioPassword: false,
    createdAt: AHORA,
    updatedAt: AHORA,
  });
}

function buildDeps() {
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn(),
  };
  const sesiones: SesionRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    eliminar: vi.fn(),
    eliminarTodasDeUsuario: vi.fn().mockResolvedValue(undefined),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { usuarios, sesiones, reloj };
}

describe("CambiarEstadoUsuarioUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: CambiarEstadoUsuarioUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new CambiarEstadoUsuarioUseCase(deps.usuarios, deps.sesiones, deps.reloj);
  });

  it("lanza UsuarioNoEncontradoError si el usuario no existe", async () => {
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(
      useCase.ejecutar({ id: "no-existe", actorId: "admin-1", accion: "activar" }),
    ).rejects.toBeInstanceOf(UsuarioNoEncontradoError);
  });

  describe("desactivar", () => {
    it("lanza AutoproteccionAdministradorError si el actor se desactiva a sí mismo", async () => {
      const propio = usuario("admin-1", "activo");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(propio);

      await expect(
        useCase.ejecutar({ id: "admin-1", actorId: "admin-1", accion: "desactivar" }),
      ).rejects.toBeInstanceOf(AutoproteccionAdministradorError);
    });

    it("lanza AccionEstadoInvalidaError si el usuario ya no está activo", async () => {
      const yaDesactivado = usuario("user-2", "desactivado");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(yaDesactivado);

      await expect(
        useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "desactivar" }),
      ).rejects.toBeInstanceOf(AccionEstadoInvalidaError);
    });

    it("desactiva, guarda y revoca todas las sesiones (RN-037)", async () => {
      const activo = usuario("user-2", "activo");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(activo);

      const resultado = await useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "desactivar" });

      expect(resultado.estado).toBe("desactivado");
      expect(deps.usuarios.guardar).toHaveBeenCalledWith(activo);
      expect(deps.sesiones.eliminarTodasDeUsuario).toHaveBeenCalledWith("user-2");
    });
  });

  describe("activar", () => {
    it("lanza AccionEstadoInvalidaError si el usuario no está desactivado", async () => {
      const activo = usuario("user-2", "activo");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(activo);

      await expect(
        useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "activar" }),
      ).rejects.toBeInstanceOf(AccionEstadoInvalidaError);
    });

    it("reactiva un usuario desactivado (CU-004 3b) sin tocar sesiones", async () => {
      const desactivado = usuario("user-2", "desactivado");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(desactivado);

      const resultado = await useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "activar" });

      expect(resultado.estado).toBe("activo");
      expect(deps.sesiones.eliminarTodasDeUsuario).not.toHaveBeenCalled();
    });
  });

  describe("desbloquear", () => {
    it("lanza AccionEstadoInvalidaError si el usuario no está bloqueado", async () => {
      const activo = usuario("user-2", "activo");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(activo);

      await expect(
        useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "desbloquear" }),
      ).rejects.toBeInstanceOf(AccionEstadoInvalidaError);
    });

    it("desbloquea y resetea el contador de intentos (ADR-004)", async () => {
      const bloqueado = usuario("user-2", "bloqueado");
      vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(bloqueado);

      const resultado = await useCase.ejecutar({ id: "user-2", actorId: "admin-1", accion: "desbloquear" });

      expect(resultado.estado).toBe("activo");
      expect(resultado.intentosFallidos).toBe(0);
    });
  });
});
