import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarPropiedades, listarCiudades } from "@/lib/api/catalogo";
import { generarSitemap } from "./sitemap";

vi.mock("@/lib/api/catalogo", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/catalogo")>("@/lib/api/catalogo");
  return {
    ...actual,
    buscarPropiedades: vi.fn(),
    listarCiudades: vi.fn(),
  };
});

const buscarPropiedadesMock = vi.mocked(buscarPropiedades);
const listarCiudadesMock = vi.mocked(listarCiudades);

const PROPIEDAD_RESUMEN = {
  codigo: "AP-001",
  titulo: "Apartamento",
  slug: "ap-001-apartamento-yopal",
  tipoOperacion: "arriendo" as const,
  tipoPropiedad: "Apartamento",
  ciudad: "Yopal",
  barrio: "La Campiña",
  precio: 1_000_000,
  area: 60,
  habitaciones: 2,
  banos: 1,
  estado: "disponible" as const,
  badgeReservada: false,
  portadaUrl: "https://cdn.example.com/ap-001.jpg",
};

describe("generarSitemap", () => {
  beforeEach(() => {
    buscarPropiedadesMock.mockReset();
    listarCiudadesMock.mockReset();
  });

  it("incluye la home + las combinaciones canónicas operación×ciudad + las fichas", async () => {
    listarCiudadesMock.mockResolvedValue({
      ok: true,
      data: [
        { ciudad: "Yopal", total: 1 },
        { ciudad: "Aguazul", total: 0 },
      ],
    });
    buscarPropiedadesMock.mockResolvedValue({
      ok: true,
      data: {
        propiedades: [PROPIEDAD_RESUMEN],
        meta: { pagina: 1, tamanoPagina: 48, total: 1, totalPaginas: 1 },
      },
    });

    const sitemap = await generarSitemap("https://arrendadora.example.com/");
    const urls = sitemap.map((entrada) => entrada.url);

    expect(urls).toContain("https://arrendadora.example.com");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/arriendo/yopal");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/venta/yopal");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/arriendo/aguazul");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/venta/aguazul");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/arriendo/ap-001-apartamento-yopal");
    // 1 home + 4 combinaciones (2 ciudades × 2 operaciones) + 1 ficha
    expect(sitemap).toHaveLength(6);
  });

  it("recorta el `/` final de la base URL (sin doble slash en la home)", async () => {
    listarCiudadesMock.mockResolvedValue({ ok: true, data: [] });
    buscarPropiedadesMock.mockResolvedValue({
      ok: true,
      data: { propiedades: [], meta: { pagina: 1, tamanoPagina: 48, total: 0, totalPaginas: 1 } },
    });

    const sitemap = await generarSitemap("https://arrendadora.example.com/");
    expect(sitemap[0]?.url).toBe("https://arrendadora.example.com");
  });

  it("pagina el catálogo completo cuando hay más de una página de propiedades", async () => {
    listarCiudadesMock.mockResolvedValue({ ok: true, data: [] });
    buscarPropiedadesMock.mockImplementation(async (filtros) => {
      const pagina = filtros?.pagina ?? 1;
      return {
        ok: true,
        data: {
          propiedades: [{ ...PROPIEDAD_RESUMEN, codigo: `AP-00${pagina}`, slug: `ap-00${pagina}` }],
          meta: { pagina, tamanoPagina: 1, total: 2, totalPaginas: 2 },
        },
      };
    });

    const sitemap = await generarSitemap("https://arrendadora.example.com");
    const urls = sitemap.map((entrada) => entrada.url);

    expect(urls).toContain("https://arrendadora.example.com/propiedades/arriendo/ap-001");
    expect(urls).toContain("https://arrendadora.example.com/propiedades/arriendo/ap-002");
    expect(buscarPropiedadesMock).toHaveBeenCalledTimes(2);
  });

  it("degrada con solo la home cuando listarCiudades y buscarPropiedades fallan", async () => {
    listarCiudadesMock.mockResolvedValue({
      ok: false,
      error: { error: "SERVICE_UNAVAILABLE", message: "No disponible", correlation_id: "id-1" },
    });
    buscarPropiedadesMock.mockResolvedValue({
      ok: false,
      error: { error: "SERVICE_UNAVAILABLE", message: "No disponible", correlation_id: "id-2" },
    });

    const sitemap = await generarSitemap("https://arrendadora.example.com");
    expect(sitemap).toEqual([{ url: "https://arrendadora.example.com", changeFrequency: "daily" }]);
  });
});
