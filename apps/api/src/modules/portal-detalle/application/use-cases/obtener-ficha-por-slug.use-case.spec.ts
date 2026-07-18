import { describe, expect, it, vi } from "vitest";
import { ObtenerFichaPorSlugUseCase } from "./obtener-ficha-por-slug.use-case";
import { PropiedadNoEncontradaError } from "../../domain/errors/dominio-detalle.errors";
import type { PropiedadDetalleRepositoryPort } from "../../domain/ports/propiedad-detalle.repository.port";
import type { PropiedadDetalle } from "../../domain/read-models/propiedad-detalle.read-model";
import type {
  FotoPublica,
  MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";
import type { ConfiguracionQueryPort } from "../../../configuracion/domain/ports/configuracion-query.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedad(overrides: Partial<PropiedadDetalle> = {}): PropiedadDetalle {
  return {
    id: "prop-1",
    codigo: "AP-001",
    titulo: "Apartamento en Chapinero",
    slug: "apartamento-chapinero",
    descripcion: "Amplio apartamento con vista.",
    tipoOperacion: "arriendo",
    tipoPropiedadNombre: "Apartamento",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    precio: 2_800_000,
    area: 75,
    habitaciones: 3,
    banos: 2,
    estrato: 4,
    parqueaderos: 1,
    estado: "disponible",
    latitud: 4.65,
    longitud: -74.06,
    amenidades: [{ nombre: "Gimnasio", cantidad: 1 }],
    ...overrides,
  };
}

function foto(id: string, esPortada: boolean): FotoPublica {
  return {
    id,
    orden: esPortada ? 1 : 2,
    esPortada,
    formatoOriginal: "jpg",
    urlOptimizada: `optimizada-${id}`,
    urlCard: `card-${id}`,
    urlThumbnail: `thumb-${id}`,
    createdAt: AHORA,
  };
}

function buildDeps(prop: PropiedadDetalle | null, galeria: FotoPublica[]) {
  const propiedades = {
    obtenerPorSlug: vi.fn().mockResolvedValue(prop),
  } as unknown as PropiedadDetalleRepositoryPort;
  const multimedia = {
    listarFotosDePropiedad: vi.fn().mockResolvedValue(galeria),
  } as unknown as MultimediaQueryPort;
  const configuracion = {
    obtenerConfiguracionPublica: vi.fn().mockResolvedValue({
      whatsappNumeroCentral: "+57 300 123 4567",
      whatsappPlantillaMensaje: "Hola {codigo}",
      nombreInmobiliaria: "Arrendadora",
      imagenGenericaUrl: "https://cdn/generica.jpg",
    }),
  } as unknown as ConfiguracionQueryPort;
  return { propiedades, multimedia, configuracion };
}

describe("ObtenerFichaPorSlugUseCase", () => {
  it("devuelve la ficha con galería y og:image de la portada (CU-001, RN-014)", async () => {
    const deps = buildDeps(propiedad(), [foto("a", false), foto("b", true)]);
    const uc = new ObtenerFichaPorSlugUseCase(deps.propiedades, deps.multimedia, deps.configuracion);

    const ficha = await uc.ejecutar({ slug: "apartamento-chapinero", portalBaseUrl: "https://portal.co/" });

    expect(deps.propiedades.obtenerPorSlug).toHaveBeenCalledWith("apartamento-chapinero");
    expect(ficha.galeria).toHaveLength(2);
    // La portada define el og:image (tamaño optimizado), no la primera foto por orden.
    expect(ficha.imagenOpenGraph).toBe("optimizada-b");
    // og:url canónico sin doble barra (se normaliza la base).
    expect(ficha.urlPublica).toBe("https://portal.co/propiedades/apartamento-chapinero");
  });

  it("usa la imagen genérica de fallback para og:image cuando no hay fotos (RN-008)", async () => {
    const deps = buildDeps(propiedad(), []);
    const uc = new ObtenerFichaPorSlugUseCase(deps.propiedades, deps.multimedia, deps.configuracion);

    const ficha = await uc.ejecutar({ slug: "apartamento-chapinero", portalBaseUrl: "https://portal.co" });

    expect(ficha.imagenOpenGraph).toBe("https://cdn/generica.jpg");
    expect(ficha.galeria).toEqual([]);
  });

  it("lanza 404 (PropiedadNoEncontradaError) cuando el slug no existe o no es público (RN-025)", async () => {
    const deps = buildDeps(null, []);
    const uc = new ObtenerFichaPorSlugUseCase(deps.propiedades, deps.multimedia, deps.configuracion);

    await expect(
      uc.ejecutar({ slug: "inexistente", portalBaseUrl: "https://portal.co" }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
    // No consulta multimedia ni configuración si la propiedad no es visible.
    expect(deps.multimedia.listarFotosDePropiedad).not.toHaveBeenCalled();
  });
});
