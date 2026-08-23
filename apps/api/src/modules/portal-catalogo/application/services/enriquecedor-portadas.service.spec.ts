import { describe, expect, it, vi } from "vitest";
import { EnriquecedorPortadasService } from "./enriquecedor-portadas.service";
import type {
  FotoPublica,
  MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";
import type { ConfiguracionQueryPort } from "../../../configuracion/domain/ports/configuracion-query.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function foto(id: string, esPortada: boolean, urlCard: string): FotoPublica {
  return {
    id,
    orden: 0,
    esPortada,
    formatoOriginal: "jpg",
    urlOptimizada: `${urlCard}-opt`,
    urlCard,
    urlThumbnail: `${urlCard}-thumb`,
    createdAt: AHORA,
  };
}

function buildDeps(fotosPorPropiedad: Record<string, FotoPublica[]>) {
  const multimedia = {
    listarFotosDePropiedad: vi
      .fn()
      .mockImplementation((id: string) => Promise.resolve(fotosPorPropiedad[id] ?? [])),
  } as unknown as MultimediaQueryPort;
  const configuracion = {
    obtenerConfiguracionPublica: vi.fn().mockResolvedValue({
      whatsappNumeroCentral: "573000000000",
      whatsappPlantillaMensaje: "Hola",
      nombreInmobiliaria: "Inmobiliaria",
      imagenGenericaUrl: "https://cdn/generica.jpg",
    }),
  } as unknown as ConfiguracionQueryPort;
  return { multimedia, configuracion };
}

describe("EnriquecedorPortadasService", () => {
  it("usa la urlCard de la foto de portada y la imagen genérica como fallback (RN-014)", async () => {
    const deps = buildDeps({
      a: [foto("a1", false, "https://cdn/a1.jpg"), foto("a2", true, "https://cdn/a2-portada.jpg")],
      b: [],
    });
    const service = new EnriquecedorPortadasService(deps.multimedia, deps.configuracion);

    const mapa = await service.resolverPortadas(["a", "b"]);

    expect(mapa.get("a")).toBe("https://cdn/a2-portada.jpg");
    expect(mapa.get("b")).toBe("https://cdn/generica.jpg");
    // La configuración (imagen genérica) se consulta una sola vez por request, no por propiedad.
    expect(deps.configuracion.obtenerConfiguracionPublica).toHaveBeenCalledTimes(1);
  });

  it("cae a la primera foto cuando ninguna está marcada como portada", async () => {
    const deps = buildDeps({ c: [foto("c1", false, "https://cdn/c1.jpg")] });
    const service = new EnriquecedorPortadasService(deps.multimedia, deps.configuracion);

    const mapa = await service.resolverPortadas(["c"]);

    expect(mapa.get("c")).toBe("https://cdn/c1.jpg");
  });

  it("no consulta la configuración cuando no hay propiedades", async () => {
    const deps = buildDeps({});
    const service = new EnriquecedorPortadasService(deps.multimedia, deps.configuracion);

    const mapa = await service.resolverPortadas([]);

    expect(mapa.size).toBe(0);
    expect(deps.configuracion.obtenerConfiguracionPublica).not.toHaveBeenCalled();
    expect(deps.multimedia.listarFotosDePropiedad).not.toHaveBeenCalled();
  });
});
