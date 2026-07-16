import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidarSesionUseCase } from "./validar-sesion.use-case";
import { Usuario } from "../../domain/entities/usuario.entity";
import { Sesion } from "../../domain/entities/sesion.entity";
import { SesionInvalidaError } from "../../domain/errors/dominio-auth.errors";
import type { UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function sesionActiva(ttlMinutos = 30) {
  return Sesion.crear({ id: "sesion-1", usuarioId: "user-1", ip: null, userAgent: null, ahora: AHORA, ttlMinutos });
}

function usuario(estado: "activo" | "bloqueado" | "desactivado" = "activo") {
  return Usuario.reconstituir({
    id: "user-1",
    nombre: "Ana",
    email: "ana@arrendadora.com",
    passwordHash: "hash",
    rol: "agente",
    estado,
    whatsapp: null,
    intentosFallidos: 0,
    requiereCambioPassword: false,
    createdAt: AHORA,
    updatedAt: AHORA,
  });
}

function buildDeps() {
  const sesiones: SesionRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    eliminar: vi.fn().mockResolvedValue(undefined),
    eliminarTodasDeUsuario: vi.fn(),
  };
  const usuarios: UsuarioRepositoryPort = {
    guardar: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
    existeEmail: vi.fn(),
    listar: vi.fn(),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { sesiones, usuarios, reloj };
}

describe("ValidarSesionUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ValidarSesionUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ValidarSesionUseCase(deps.sesiones, deps.usuarios, deps.reloj);
  });

  it("lanza SesionInvalidaError si la sesión no existe", async () => {
    vi.mocked(deps.sesiones.buscarPorId).mockResolvedValue(null);

    await expect(useCase.ejecutar({ sesionId: "no-existe" })).rejects.toBeInstanceOf(SesionInvalidaError);
  });

  it("elimina y rechaza la sesión expirada", async () => {
    const sesion = sesionActiva();
    vi.mocked(deps.sesiones.buscarPorId).mockResolvedValue(sesion);
    vi.mocked(deps.reloj.ahora).mockReturnValue(new Date(sesion.expiraEn.getTime() + 1));

    await expect(useCase.ejecutar({ sesionId: sesion.id })).rejects.toBeInstanceOf(SesionInvalidaError);
    expect(deps.sesiones.eliminar).toHaveBeenCalledWith(sesion.id);
  });

  it("elimina y rechaza la sesión si el usuario ya no existe (defensa en profundidad)", async () => {
    const sesion = sesionActiva();
    vi.mocked(deps.sesiones.buscarPorId).mockResolvedValue(sesion);
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(null);

    await expect(useCase.ejecutar({ sesionId: sesion.id })).rejects.toBeInstanceOf(SesionInvalidaError);
    expect(deps.sesiones.eliminar).toHaveBeenCalledWith(sesion.id);
  });

  it("elimina y rechaza la sesión si el usuario ya no está activo", async () => {
    const sesion = sesionActiva();
    vi.mocked(deps.sesiones.buscarPorId).mockResolvedValue(sesion);
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuario("bloqueado"));

    await expect(useCase.ejecutar({ sesionId: sesion.id })).rejects.toBeInstanceOf(SesionInvalidaError);
    expect(deps.sesiones.eliminar).toHaveBeenCalledWith(sesion.id);
  });

  it("renueva la sesión (sliding TTL, GAP-005) y retorna usuario + sesión", async () => {
    const sesion = sesionActiva();
    const usuarioActivo = usuario("activo");
    vi.mocked(deps.sesiones.buscarPorId).mockResolvedValue(sesion);
    vi.mocked(deps.usuarios.buscarPorId).mockResolvedValue(usuarioActivo);

    const nuevaAhora = new Date(AHORA.getTime() + 5 * 60_000);
    vi.mocked(deps.reloj.ahora).mockReturnValue(nuevaAhora);

    const resultado = await useCase.ejecutar({ sesionId: sesion.id });

    expect(sesion.expiraEn).toEqual(new Date(nuevaAhora.getTime() + 30 * 60_000));
    expect(deps.sesiones.guardar).toHaveBeenCalledWith(sesion);
    expect(deps.sesiones.eliminar).not.toHaveBeenCalled();
    expect(resultado).toEqual({ usuario: usuarioActivo, sesion });
  });
});
