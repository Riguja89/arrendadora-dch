import type { Metadata } from "next";
import Image from "next/image";
import {
  buscarPropiedades,
  construirQueryCatalogo,
  listarCiudades,
  listarDestacadas,
  listarTiposPropiedad,
  type CiudadConteoWire,
  type TipoPropiedadPublicoWire,
} from "@/lib/api/catalogo";
import { parseEnteroPositivo, parsePagina } from "@/lib/format";
import { esOperacionValida } from "@/lib/rutas";
import { FiltrosCatalogoSticky } from "@/components/catalogo/filtros-catalogo-sticky";
import { PropiedadCard } from "@/components/catalogo/propiedad-card";
import { CatalogoResultados } from "@/components/catalogo/catalogo-resultados";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

async function resolverFiltros(searchParams: HomePageProps["searchParams"]) {
  const params = await searchParams;
  const tipoOperacionParam = primerValor(params.tipo_operacion);

  return {
    tipoOperacion: esOperacionValida(tipoOperacionParam) ? tipoOperacionParam : undefined,
    tipoPropiedad: primerValor(params.tipo_propiedad),
    ciudad: primerValor(params.ciudad),
    precioMin: parseEnteroPositivo(primerValor(params.precio_min)),
    precioMax: parseEnteroPositivo(primerValor(params.precio_max)),
    pagina: parsePagina(primerValor(params.pagina)),
  };
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const filtros = await resolverFiltros(searchParams);

  if (filtros.ciudad && filtros.tipoOperacion) {
    const etiqueta = filtros.tipoOperacion === "arriendo" ? "en arriendo" : "en venta";
    return {
      title: `Propiedades ${etiqueta} en ${filtros.ciudad}`,
      description: `Explora propiedades ${etiqueta} en ${filtros.ciudad}, Casanare: apartamentos, casas, locales y más con Arrendadora.`,
    };
  }

  if (filtros.ciudad) {
    return {
      title: `Propiedades en ${filtros.ciudad}`,
      description: `Explora el catálogo completo de propiedades disponibles en ${filtros.ciudad}, Casanare.`,
    };
  }

  return {
    title: "Catálogo de propiedades en Yopal y Aguazul",
    description:
      "Explora apartamentos, casas, locales y más en arriendo y venta en Yopal y Aguazul, Casanare.",
  };
}

/** Home + catálogo (CU-001/CU-002/CU-003, spec-portal-catalogo) — listado SSR con filtros por URL. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const filtros = await resolverFiltros(searchParams);
  const hayFiltrosActivos = Boolean(
    filtros.tipoOperacion || filtros.tipoPropiedad || filtros.ciudad || filtros.precioMin || filtros.precioMax,
  );
  const mostrarDestacadas = !hayFiltrosActivos && filtros.pagina === 1;

  const [resultadoBusqueda, respuestaTipos, respuestaCiudades, respuestaDestacadas] = await Promise.all([
    buscarPropiedades(filtros),
    listarTiposPropiedad(),
    listarCiudades(),
    mostrarDestacadas ? listarDestacadas() : Promise.resolve(null),
  ]);

  // Degradación graciosa (RN-024): si los catálogos de filtro fallan, los selects quedan vacíos
  // pero el listado principal sigue funcionando.
  const tiposPropiedad: TipoPropiedadPublicoWire[] = respuestaTipos.ok ? respuestaTipos.data : [];
  const ciudades: CiudadConteoWire[] = respuestaCiudades.ok ? respuestaCiudades.data : [];

  function buildHrefPagina(pagina: number): string {
    return `/${construirQueryCatalogo({ ...filtros, pagina })}`;
  }

  return (
    <main className="container">
      <header className="portal-hero">
        <div className="portal-hero__marca">
          {/* Logo decorativo: la marca queda expresada textualmente en el <p> siguiente
              (`portal-hero__nombre`), por lo que `alt=""` evita duplicar el anuncio
              del nombre en lectores de pantalla (W3C WCAG H67 — imagen adyacente al
              texto que sirve como accessible name). */}
          <Image
            src="/logo-simple-dch.svg"
            alt=""
            width={96}
            height={96}
            priority
            className="portal-hero__logo"
          />
          <p className="portal-hero__nombre">D-CH Inmobiliaria</p>
          <p className="portal-hero__descriptor">Servicios inmobiliarios</p>
        </div>
        <h1 className="portal-hero__titulo">
          Hogares exclusivos en <span className="portal-hero__acento">Casanare</span>
        </h1>
        <p className="portal-hero__subtitulo">
          Explora nuestro catálogo de propiedades en arriendo y venta en Yopal y Aguazul.
          Filtra por operación, tipo de inmueble, ciudad y precio para encontrar la opción que buscas.
        </p>
      </header>

      {mostrarDestacadas ? (
        <section className="destacadas" aria-labelledby="destacadas-titulo">
          <h2 id="destacadas-titulo">Propiedades destacadas</h2>
          {respuestaDestacadas?.ok && respuestaDestacadas.data.length > 0 ? (
            <ul className="propiedad-grid">
              {respuestaDestacadas.data.map((propiedad) => (
                <PropiedadCard key={propiedad.codigo} propiedad={propiedad} />
              ))}
            </ul>
          ) : (
            <p className="mensaje-cortesia">
              Próximamente nuevas propiedades. Contáctenos para conocer disponibilidad.
            </p>
          )}
        </section>
      ) : null}

      <section className="catalogo" aria-labelledby="catalogo-titulo">
        <div className="catalogo__encabezado">
          <h2 id="catalogo-titulo">Catálogo completo</h2>
        </div>

        <FiltrosCatalogoSticky
          tiposPropiedad={tiposPropiedad}
          ciudades={ciudades}
          valoresIniciales={filtros}
        />

        <CatalogoResultados resultadoBusqueda={resultadoBusqueda} buildHrefPagina={buildHrefPagina} />
      </section>
    </main>
  );
}
