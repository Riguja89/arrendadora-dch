import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrearPropiedadUseCase, type CrearPropiedadInput } from "./crear-propiedad.use-case";
import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import {
  AmenidadInvalidaError,
  TipoPropiedadInvalidoError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import type { GeneradorCodigoPort } from "../../domain/ports/generador-codigo.port";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";
import type { RelojPort } from "../../domain/ports/reloj.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const TIPO_ACTIVO = CatalogoItem.reconstituir({
  id: "tipo-1",
  nombre: "Apartamento",
  activo: true,
  orden: 1,
  createdAt: AHORA,
  updatedAt: AHORA,
});

function buildDeps() {
  const propiedades: PropiedadRepositoryPort = {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn(),
    listar: vi.fn(),
    cambiarEstado: vi.fn(),
  };
  const tipos: CatalogoRepositoryPort = {
    listar: vi.fn(),
    buscarPorId: vi.fn().mockResolvedValue(TIPO_ACTIVO),
    buscarPorNombre: vi.fn(),
    guardar: vi.fn(),
    existenActivos: vi.fn(),
  };
  const amenidades: CatalogoRepositoryPort = {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    buscarPorNombre: vi.fn(),
    guardar: vi.fn(),
    existenActivos: vi.fn().mockResolvedValue(true),
  };
  const generadorCodigo: GeneradorCodigoPort = { siguiente: vi.fn().mockResolvedValue("AP-007") };
  const idGenerator: IdGeneratorPort = { nuevo: vi.fn().mockReturnValue("prop-uuid-1") };
  const reloj: RelojPort = { ahora: vi.fn().mockReturnValue(AHORA) };
  return { propiedades, tipos, amenidades, generadorCodigo, idGenerator, reloj };
}

function input(over: Partial<CrearPropiedadInput> = {}): CrearPropiedadInput {
  return {
    actor: { id: "u-agente", rol: "agente" },
    titulo: "Apartamento en Chapinero",
    descripcion: "Amplio",
    tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    direccion: null,
    precio: 1_500_000,
    area: 85,
    habitaciones: 3,
    banos: 2,
    estrato: 4,
    parqueaderos: 1,
    destacada: false,
    agenteId: null,
    amenidades: [],
    ...over,
  };
}

describe("CrearPropiedadUseCase", () => {
  let deps: ReturnType<typeof buildDeps>;
  let useCase: CrearPropiedadUseCase;

  beforeEach(() => {
    deps = buildDeps();
    useCase = new CrearPropiedadUseCase(
      deps.propiedades,
      deps.tipos,
      deps.amenidades,
      deps.generadorCodigo,
      deps.idGenerator,
      deps.reloj,
    );
  });

  it("lanza TipoPropiedadInvalidoError si el tipo no existe, sin persistir", async () => {
    vi.mocked(deps.tipos.buscarPorId).mockResolvedValue(null);
    await expect(useCase.ejecutar(input())).rejects.toBeInstanceOf(TipoPropiedadInvalidoError);
    expect(deps.propiedades.guardar).not.toHaveBeenCalled();
  });

  it("lanza TipoPropiedadInvalidoError si el tipo está inactivo", async () => {
    const inactivo = CatalogoItem.reconstituir({
      id: "tipo-1",
      nombre: "X",
      activo: false,
      orden: 1,
      createdAt: AHORA,
      updatedAt: AHORA,
    });
    vi.mocked(deps.tipos.buscarPorId).mockResolvedValue(inactivo);
    await expect(useCase.ejecutar(input())).rejects.toBeInstanceOf(TipoPropiedadInvalidoError);
  });

  it("lanza AmenidadInvalidaError si alguna amenidad no está activa", async () => {
    vi.mocked(deps.amenidades.existenActivos).mockResolvedValue(false);
    await expect(
      useCase.ejecutar(input({ amenidades: [{ amenidadId: "am-x", cantidad: 1 }] })),
    ).rejects.toBeInstanceOf(AmenidadInvalidaError);
    expect(deps.propiedades.guardar).not.toHaveBeenCalled();
  });

  it("autoasigna al Agente como responsable (RN-010) e ignora agenteId recibido", async () => {
    const propiedad = await useCase.ejecutar(input({ actor: { id: "u-agente", rol: "agente" }, agenteId: "otro" }));
    expect(propiedad.agenteId).toBe("u-agente");
    expect(propiedad.codigo).toBe("AP-007");
    expect(propiedad.id).toBe("prop-uuid-1");
    expect(deps.propiedades.guardar).toHaveBeenCalledTimes(1);
  });

  it("el Administrador puede asignar otro agente (RN-011)", async () => {
    const propiedad = await useCase.ejecutar(
      input({ actor: { id: "u-admin", rol: "administrador" }, agenteId: "agente-9" }),
    );
    expect(propiedad.agenteId).toBe("agente-9");
  });

  it("no valida amenidades cuando la lista viene vacía", async () => {
    await useCase.ejecutar(input({ amenidades: [] }));
    expect(deps.amenidades.existenActivos).not.toHaveBeenCalled();
  });
});
