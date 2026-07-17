import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActualizarConfiguracionUseCase } from "./actualizar-configuracion.use-case";
import { ConfiguracionSistema } from "../../domain/entities/configuracion-sistema.entity";
import { NumeroWhatsappInvalidoError } from "../../domain/errors/dominio-configuracion.errors";
import type { ConfiguracionRepositoryPort } from "../../domain/ports/configuracion.repository.port";
import type { RelojPort } from "../../domain/ports/reloj.port";
import { CONFIGURACION_SINGLETON_ID } from "../../domain/rules/configuracion-constantes";

const AHORA = new Date("2026-07-05T09:30:00.000Z");

const INPUT_VALIDO = {
  actorId: "admin-1",
  whatsappNumeroCentral: "+57 301 555 8899",
  whatsappPlantillaMensaje: "Buen día, consulto por la propiedad {codigo}.",
  nombreInmobiliaria: "Arrendadora del Valle",
  imagenGenericaUrl: "https://cdn.arrendadora.com/og.png",
};

function buildDeps() {
  const configuraciones: ConfiguracionRepositoryPort = {
    obtener: vi.fn(),
    guardar: vi.fn().mockResolvedValue(undefined),
  };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { configuraciones, reloj };
}

describe("ActualizarConfiguracionUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: ActualizarConfiguracionUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new ActualizarConfiguracionUseCase(deps.configuraciones, deps.reloj);
  });

  it("actualiza la configuración existente y registra el actor y la marca de tiempo", async () => {
    const existente = ConfiguracionSistema.crearPorDefecto({
      id: CONFIGURACION_SINGLETON_ID,
      ahora: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(deps.configuraciones.obtener).mockResolvedValue(existente);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);
    const props = resultado.toProps();

    expect(props.whatsappNumeroCentral).toBe("+57 301 555 8899");
    expect(props.nombreInmobiliaria).toBe("Arrendadora del Valle");
    expect(props.actualizadaPor).toBe("admin-1");
    expect(props.updatedAt).toEqual(AHORA);
    expect(deps.configuraciones.guardar).toHaveBeenCalledWith(existente);
  });

  it("get-or-create: parte de la semilla (id fijo) cuando aún no hay fila y persiste los cambios", async () => {
    vi.mocked(deps.configuraciones.obtener).mockResolvedValue(null);

    const resultado = await useCase.ejecutar(INPUT_VALIDO);
    const props = resultado.toProps();

    expect(props.id).toBe(CONFIGURACION_SINGLETON_ID);
    expect(props.whatsappPlantillaMensaje).toBe("Buen día, consulto por la propiedad {codigo}.");
    expect(props.actualizadaPor).toBe("admin-1");
    expect(deps.configuraciones.guardar).toHaveBeenCalledTimes(1);
  });

  it("propaga el error de dominio y NO persiste cuando un campo es inválido", async () => {
    const existente = ConfiguracionSistema.crearPorDefecto({ id: CONFIGURACION_SINGLETON_ID, ahora: AHORA });
    vi.mocked(deps.configuraciones.obtener).mockResolvedValue(existente);

    await expect(
      useCase.ejecutar({ ...INPUT_VALIDO, whatsappNumeroCentral: "invalido" }),
    ).rejects.toBeInstanceOf(NumeroWhatsappInvalidoError);
    expect(deps.configuraciones.guardar).not.toHaveBeenCalled();
  });
});
