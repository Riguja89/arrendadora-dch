import type { MetadataRoute } from "next";
import { buscarPropiedades, listarCiudades } from "@/lib/api/catalogo";
import { construirHrefCatalogoSegmento, construirHrefFicha, OPERACIONES_VALIDAS } from "@/lib/rutas";

/** Máximo de `tamano_pagina` permitido por el contrato (DESIGN-029, línea 67). */
export const TAMANO_PAGINA_SITEMAP = 48;

/**
 * Resguardo defensivo — el universo hoy es chico (solo Yopal/Aguazul, GAP-005), pero evita un
 * loop sin cota si el catálogo crece mucho más de lo previsto.
 */
export const MAXIMO_PAGINAS_SITEMAP = 20;

/**
 * Construye el `sitemap.xml` (ADR-010, ADR-018 Decisión 1.A) — combinaciones canónicas
 * operación×ciudad (hoy ≤ 4: Yopal/Aguazul × arriendo/venta) + todas las fichas de propiedades
 * visibles (`disponible`/`reservada`, RN-005/RN-013/RN-025). Reusa los mismos helpers de
 * `src/lib/rutas.ts` que construyen los `href` reales de la app — el sitemap nunca puede divergir
 * de esas URLs. Lógica extraída de `app/sitemap.ts` para poder testearla sin el runtime de Next.
 */
export async function generarSitemap(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl.replace(/\/+$/, "");

  const [respuestaCiudades, primeraPagina] = await Promise.all([
    listarCiudades(),
    buscarPropiedades({ tamanoPagina: TAMANO_PAGINA_SITEMAP, pagina: 1 }),
  ]);

  const ciudades = respuestaCiudades.ok ? respuestaCiudades.data : [];
  const entradasCatalogo: MetadataRoute.Sitemap = OPERACIONES_VALIDAS.flatMap((operacion) =>
    ciudades.map((ciudad) => ({
      url: `${baseUrl}${construirHrefCatalogoSegmento(operacion, ciudad.ciudad)}`,
      changeFrequency: "daily" as const,
    })),
  );

  const propiedades = primeraPagina.ok ? [...primeraPagina.data.propiedades] : [];

  if (primeraPagina.ok && primeraPagina.data.meta.totalPaginas > 1) {
    const totalPaginas = Math.min(primeraPagina.data.meta.totalPaginas, MAXIMO_PAGINAS_SITEMAP);
    const paginasRestantes = Array.from({ length: totalPaginas - 1 }, (_, indice) => indice + 2);
    const respuestasRestantes = await Promise.all(
      paginasRestantes.map((pagina) => buscarPropiedades({ tamanoPagina: TAMANO_PAGINA_SITEMAP, pagina })),
    );
    for (const respuesta of respuestasRestantes) {
      if (respuesta.ok) propiedades.push(...respuesta.data.propiedades);
    }
  }

  const entradasFichas: MetadataRoute.Sitemap = propiedades.map((propiedad) => ({
    url: `${baseUrl}${construirHrefFicha(propiedad.tipoOperacion, propiedad.slug)}`,
    changeFrequency: "weekly" as const,
  }));

  return [{ url: baseUrl, changeFrequency: "daily" as const }, ...entradasCatalogo, ...entradasFichas];
}
