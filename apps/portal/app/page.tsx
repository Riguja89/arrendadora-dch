import type { Metadata } from "next";
import type { TipoOperacion } from "@arrendadora/shared";
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
import { FiltrosCatalogoForm } from "@/components/catalogo/filtros-catalogo-form";
import { PropiedadCard } from "@/components/catalogo/propiedad-card";
import { Paginacion } from "@/components/catalogo/paginacion";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function esTipoOperacionValida(valor: string | undefined): valor is TipoOperacion {
  return valor === "arriendo" || valor === "venta";
}

async function resolverFiltros(searchParams: HomePageProps["searchParams"]) {
  const params = await searchParams;
  const tipoOperacionParam = primerValor(params.tipo_operacion);

  return {
    tipoOperacion: esTipoOperacionValida(tipoOperacionParam) ? tipoOperacionParam : undefined,
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
      description: `Explorá propiedades ${etiqueta} en ${filtros.ciudad}, Casanare: apartamentos, casas, locales y más con Arrendadora.`,
    };
  }

  if (filtros.ciudad) {
    return {
      title: `Propiedades en ${filtros.ciudad}`,
      description: `Explorá el catálogo completo de propiedades disponibles en ${filtros.ciudad}, Casanare.`,
    };
  }

  return {
    title: "Catálogo de propiedades en Yopal y Aguazul",
    description:
      "Explorá apartamentos, casas, locales y más en arriendo y venta en Yopal y Aguazul, Casanare.",
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
        <h1>Arrendadora — arriendo y venta en Yopal y Aguazul</h1>
        <p>
          Explorá nuestro catálogo de propiedades en Casanare. Filtrá por operación, tipo de
          inmueble, ciudad y precio para encontrar la opción que buscás.
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
        <h2 id="catalogo-titulo">Catálogo completo</h2>

        <FiltrosCatalogoForm
          tiposPropiedad={tiposPropiedad}
          ciudades={ciudades}
          valoresIniciales={filtros}
        />

        {resultadoBusqueda.ok ? (
          <>
            <p className="catalogo__contador" role="status">
              {resultadoBusqueda.data.meta.total === 1
                ? "1 propiedad encontrada"
                : `${resultadoBusqueda.data.meta.total} propiedades encontradas`}
            </p>

            {resultadoBusqueda.data.propiedades.length > 0 ? (
              <ul className="propiedad-grid">
                {resultadoBusqueda.data.propiedades.map((propiedad) => (
                  <PropiedadCard key={propiedad.codigo} propiedad={propiedad} />
                ))}
              </ul>
            ) : (
              <div className="catalogo__sin-resultados" role="status">
                <p>No encontramos propiedades con esos filtros. Intentá con otros criterios.</p>
                <p>
                  ¿Buscás algo específico?{" "}
                  <a href="/">Consultá directamente con un agente para atención personalizada.</a>
                </p>
              </div>
            )}

            <Paginacion
              paginaActual={resultadoBusqueda.data.meta.pagina}
              totalPaginas={resultadoBusqueda.data.meta.totalPaginas}
              buildHref={buildHrefPagina}
            />
          </>
        ) : (
          <div className="catalogo__error" role="alert">
            <p>{resultadoBusqueda.error.message}</p>
          </div>
        )}
      </section>
    </main>
  );
}
