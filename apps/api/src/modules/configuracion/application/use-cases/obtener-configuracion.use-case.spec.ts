import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObtenerConfiguracionUseCase } from "./obtener-configuracion.use-case";
import { ConfiguracionSistema } from "../../domain/entities/configuracion-sistema.entity";
import type { ConfiguracionRepositoryPort } from "../../domain/ports/configuracion.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";
import { CONFIGURACION_SINGLETON_ID } from "../../domain/rules/configuracion-constantes";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function buildDeps() {
  const configuraciones: ConfiguracionRepositoryPort = {
    obtener: vi.fn(),
    guardar: vi.fn().mockResolvedValue(undefined),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { configuraciones, reloj };
}

describe("ObtenerConfiguracionUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ObtenerConfiguracionUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ObtenerConfiguracionUseCase(deps.configuraciones, deps.reloj);
  });

  it("devuelve la configuración existente sin sembrar cuando ya hay fila", async () => {
    const existente = ConfiguracionSistema.crearPorDefecto({ id: CONFIGURACION_SINGLETON_ID, ahora: AHORA });
    vi.mocked(deps.configuraciones.obtener).mockResolvedValue(existente);

    const resultado = await useCase.ejecutar();

    expect(resultado).toBe(existente);
    expect(deps.configuraciones.guardar).not.toHaveBeenCalled();
  });

  it("siembra la configuración por defecto con el id fijo del singleton cuando aún no existe", async () => {
    vi.mocked(deps.configuraciones.obtener).mockResolvedValue(null);

    const resultado = await useCase.ejecutar();

    expect(resultado.toProps().id).toBe(CONFIGURACION_SINGLETON_ID);
    expect(deps.configuraciones.guardar).toHaveBeenCalledWith(resultado);
    expect(deps.configuraciones.guardar).toHaveBeenCalledTimes(1);
  });
});
