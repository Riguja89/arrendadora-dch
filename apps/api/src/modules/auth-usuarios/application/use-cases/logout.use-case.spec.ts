import { describe, expect, it, vi } from "vitest";
import { LogoutUseCase } from "./logout.use-case";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";

describe("LogoutUseCase", () => {
  it("revoca la sesión indicada de inmediato (ADR-004)", async () => {
    const sesiones: SesionRepositoryPort = {
      guardar: vi.fn(),
      buscarPorId: vi.fn(),
      eliminar: vi.fn().mockResolvedValue(undefined),
      eliminarTodasDeUsuario: vi.fn(),
    };
    const useCase = new LogoutUseCase(sesiones);

    await useCase.ejecutar({ sesionId: "sesion-1" });

    expect(sesiones.eliminar).toHaveBeenCalledWith("sesion-1");
    expect(sesiones.eliminar).toHaveBeenCalledTimes(1);
  });
});
