import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { PropiedadDetalle, TipoOperacion } from "@arrendadora/shared";
import type { RespuestaApi } from "@/lib/http-client";
import {
  buscarPropiedades,
  construirQueryCatalogo,
  listarCiudades,
  listarTiposPropiedad,
  type CiudadConteoWire,
  type TipoPropiedadPublicoWire,
} from "@/lib/api/catalogo";
import { obtenerFichaPorSlug } from "@/lib/api/detalle";
import { parseEnteroPositivo, parsePagina } from "@/lib/format";
import {
  OPERACIONES_VALIDAS,
  construirHrefCatalogoSegmento,
  construirHrefFicha,
  normalizarSegmentoCiudad,
  resolverSegmentoPropiedades,
  type ResolucionSegmento,
} from "@/lib/rutas";
import { FiltrosCatalogoForm } from "@/components/catalogo/filtros-catalogo-form";
import { CatalogoResultados } from "@/components/catalogo/catalogo-resultados";
import { FichaPropiedad } from "@/components/detalle/ficha-propiedad";

interface PaginaSegmentoProps {
  params: Promise<{ operacion: string; segmento: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Memoiza `listarCiudades()` dentro del mismo request — `generateMetadata`, `generateStaticParams`
 * (build time) y la página comparten la misma resolución sin duplicar el fetch. */
const obtenerCiudades = cache(async () => listarCiudades());

/** Memoiza el fetch de la ficha dentro del mismo request, igual que hacía `[slug]/page.tsx`. */
const obtenerFicha = cache(async (slug: string) => obtenerFichaPorSlug(slug));

type ResolucionPagina =
  | { tipo: "invalido" }
  | { tipo: "catalogo"; operacion: TipoOperacion; ciudad: string }
  | { tipo: "ficha"; operacion: TipoOperacion; slug: string; respuesta: RespuestaApi<PropiedadDetalle> };

/**
 * Valida que la ficha resuelta pertenezca a la operación del segmento de URL (ADR-018 Decisión 1,
 * "Validación anti-duplicado"): evita que la misma propiedad quede indexable bajo dos URLs
 * distintas (`/propiedades/arriendo/{slug}` y `/propiedades/venta/{slug}`). Un mismatch se trata
 * igual que un slug inexistente — `NOT_FOUND` sintético, nunca inventado hacia el usuario porque
 * siempre deriva en `notFound()`, no se muestra su `message`.
 */
async function resolverFichaConValidacion(
  operacionEsperada: TipoOperacion,
  slug: string,
): Promise<RespuestaApi<PropiedadDetalle>> {
  const respuesta = await obtenerFicha(slug);
  if (!respuesta.ok) return respuesta;

  if (respuesta.data.tipoOperacion !== operacionEsperada) {
    return {
      ok: false,
      error: {
        error: "NOT_FOUND",
        message: "Esta propiedad no está disponible bajo esa operación.",
        correlation_id: "operacion-mismatch",
      },
    };
  }

  return respuesta;
}

/**
 * Único punto de resolución del segmento `[operacion]/[segmento]` (ADR-018 Decisión 1) —
 * compartido por `generateMetadata` y la página vía `cache()`, así ambas ejecuciones del mismo
 * request reutilizan la misma llamada a `listarCiudades()` / `obtenerFichaPorSlug()`.
 */
const resolverPagina = cache(
  async (operacionParam: string, segmentoParam: string): Promise<ResolucionPagina> => {
    const respuestaCiudades = await obtenerCiudades();
    const ciudades = respuestaCiudades.ok ? respuestaCiudades.data : [];
    const resolucion: ResolucionSegmento = resolverSegmentoPropiedades(
      operacionParam,
      segmentoParam,
      ciudades,
    );

    if (resolucion.tipo === "invalido") return { tipo: "invalido" };
    if (resolucion.tipo === "catalogo") return resolucion;

    const respuesta = await resolverFichaConValidacion(resolucion.operacion, resolucion.slug);
    return { tipo: "ficha", operacion: resolucion.operacion, slug: resolucion.slug, respuesta };
  },
);

/**
 * Combinaciones canónicas operación×ciudad conocidas en build time (ADR-018 Decisión 1 —
 * universo hoy ≤ 4: Yopal/Aguazul × arriendo/venta, GAP-002/GAP-005). `dynamicParams=true` +
 * `cache: "no-store"` en los fetches (`http-client.ts`) hacen que una ciudad nueva o un slug de
 * propiedad se resuelvan on-demand por request, sin bloquear el build si el backend no está
 * disponible en build time (`listarCiudades()` degrada a `[]` — ver "Degradación graciosa").
 */
export async function generateStaticParams() {
  const respuesta = await listarCiudades();
  if (!respuesta.ok) return [];

  return OPERACIONES_VALIDAS.flatMap((operacion) =>
    respuesta.data.map((ciudad) => ({
      operacion,
      segmento: normalizarSegmentoCiudad(ciudad.ciudad),
    })),
  );
}

export const dynamicParams = true;

/** SEO: canonical estable (sin query params de filtros) + Open Graph por propiedad (RN-008, ADR-010/018). */
export async function generateMetadata({ params }: PaginaSegmentoProps): Promise<Metadata> {
  const { operacion, segmento } = await params;
  const resolucion = await resolverPagina(operacion, segmento);

  if (resolucion.tipo === "invalido") {
    return { title: "Página no encontrada" };
  }

  if (resolucion.tipo === "catalogo") {
    const etiqueta = resolucion.operacion === "arriendo" ? "en arriendo" : "en venta";
    return {
      title: `Propiedades ${etiqueta} en ${resolucion.ciudad}`,
      description: `Explora propiedades ${etiqueta} en ${resolucion.ciudad}, Casanare: apartamentos, casas, locales y más con Arrendadora.`,
      alternates: { canonical: construirHrefCatalogoSegmento(resolucion.operacion, resolucion.ciudad) },
      robots: { index: true, follow: true },
    };
  }

  if (!resolucion.respuesta.ok) {
    return { title: "Propiedad no encontrada" };
  }

  const { openGraph } = resolucion.respuesta.data;
  return {
    title: openGraph.titulo,
    description: openGraph.descripcion,
    alternates: { canonical: construirHrefFicha(resolucion.operacion, resolucion.slug) },
    robots: { index: true, follow: true },
    openGraph: {
      title: openGraph.titulo,
      description: openGraph.descripcion,
      images: [{ url: openGraph.imagen }],
      url: openGraph.url,
      type: "website",
    },
  };
}

interface CatalogoSegmentoProps {
  operacion: TipoOperacion;
  ciudad: string;
  searchParams: PaginaSegmentoProps["searchParams"];
}

/**
 * Catálogo filtrado por operación/ciudad (CU-001) sobre la ruta canónica indexable
 * `/propiedades/{operacion}/{ciudad}` (ADR-018 Decisión 1.A). El resto de filtros de RN-024
 * (`tipo_propiedad`, precio, paginación) se leen de `searchParams` **sobre** esta ruta — el
 * comportamiento acumulativo no cambia, solo se promovieron `tipo_operacion`/`ciudad` al path.
 */
async function CatalogoSegmento({ operacion, ciudad, searchParams }: CatalogoSegmentoProps) {
  const params = await searchParams;
  const tipoPropiedad = primerValor(params.tipo_propiedad);
  const precioMin = parseEnteroPositivo(primerValor(params.precio_min));
  const precioMax = parseEnteroPositivo(primerValor(params.precio_max));
  const pagina = parsePagina(primerValor(params.pagina));

  const [resultadoBusqueda, respuestaTipos, respuestaCiudades] = await Promise.all([
    buscarPropiedades({ tipoOperacion: operacion, ciudad, tipoPropiedad, precioMin, precioMax, pagina }),
    listarTiposPropiedad(),
    obtenerCiudades(),
  ]);

  // Degradación graciosa (RN-024): si los catálogos de filtro fallan, los selects quedan vacíos
  // pero el listado principal sigue funcionando.
  const tiposPropiedad: TipoPropiedadPublicoWire[] = respuestaTipos.ok ? respuestaTipos.data : [];
  const ciudades: CiudadConteoWire[] = respuestaCiudades.ok ? respuestaCiudades.data : [];

  function buildHrefPagina(paginaDestino: number): string {
    const query = construirQueryCatalogo({ tipoPropiedad, precioMin, precioMax, pagina: paginaDestino });
    return `${construirHrefCatalogoSegmento(operacion, ciudad)}${query}`;
  }

  const etiqueta = operacion === "arriendo" ? "en arriendo" : "en venta";

  return (
    <main className="container">
      <header className="portal-hero">
        <h1>
          Propiedades {etiqueta} en {ciudad}
        </h1>
        <p>
          Explora el catálogo de propiedades {etiqueta} en {ciudad}, Casanare. Filtra por tipo de
          inmueble y precio para encontrar la opción que buscas.
        </p>
      </header>

      <section className="catalogo" aria-labelledby="catalogo-titulo">
        <h2 id="catalogo-titulo">Resultados</h2>

        <FiltrosCatalogoForm
          tiposPropiedad={tiposPropiedad}
          ciudades={ciudades}
          valoresIniciales={{ tipoOperacion: operacion, ciudad, tipoPropiedad, precioMin, precioMax }}
        />

        <CatalogoResultados resultadoBusqueda={resultadoBusqueda} buildHrefPagina={buildHrefPagina} />
      </section>
    </main>
  );
}

/**
 * Ruta de segmento `/propiedades/{operacion}/{segmento}` (ADR-010, ADR-018 Decisión 1) — una
 * única carpeta física porque Next.js no admite `[ciudad]` y `[slug]` como carpetas dinámicas
 * distintas en la misma posición de ruta. `segmento` se desambigua en servidor
 * (`resolverSegmentoPropiedades`, `src/lib/rutas.ts`): ciudad conocida → catálogo (CU-001); en
 * caso contrario → slug de propiedad (CU-002). `operacion` inválida, ciudad inexistente
 * interpretada como slug que no resuelve, o mismatch operación/propiedad → 404 (RN-025).
 */
export default async function PaginaSegmentoPropiedades({ params, searchParams }: PaginaSegmentoProps) {
  const { operacion, segmento } = await params;
  const resolucion = await resolverPagina(operacion, segmento);

  if (resolucion.tipo === "invalido") {
    notFound();
  }

  if (resolucion.tipo === "catalogo") {
    return <CatalogoSegmento operacion={resolucion.operacion} ciudad={resolucion.ciudad} searchParams={searchParams} />;
  }

  if (!resolucion.respuesta.ok) {
    if (resolucion.respuesta.error.error === "NOT_FOUND") {
      notFound();
    }

    return (
      <main className="container">
        <div className="catalogo__error" role="alert">
          <p>{resolucion.respuesta.error.message}</p>
        </div>
      </main>
    );
  }

  return <FichaPropiedad propiedad={resolucion.respuesta.data} />;
}
