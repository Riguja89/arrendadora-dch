import type { RespuestaApi } from "@/lib/http-client";
import type { ResultadoBusquedaCatalogo } from "@/lib/api/catalogo";
import { PropiedadCard } from "./propiedad-card";
import { Paginacion } from "./paginacion";

interface CatalogoResultadosProps {
  resultadoBusqueda: RespuestaApi<ResultadoBusquedaCatalogo>;
  /** Construye el `href` de una página dada, preservando los filtros activos (query string). */
  buildHrefPagina: (pagina: number) => string;
}

/**
 * Contador + grilla de resultados + paginación (CU-001/CU-002, HU-002) — reusado por el catálogo
 * general de la Home (`app/page.tsx`) y por las rutas de segmento indexables por ciudad/operación
 * (`app/propiedades/[operacion]/[segmento]/page.tsx`, ADR-018 Decisión 1). Server Component puro:
 * la resolución de `resultadoBusqueda` (fetch + filtros) queda a cargo del caller.
 */
export function CatalogoResultados({ resultadoBusqueda, buildHrefPagina }: CatalogoResultadosProps) {
  if (!resultadoBusqueda.ok) {
    return (
      <div className="catalogo__error" role="alert">
        <p>{resultadoBusqueda.error.message}</p>
      </div>
    );
  }

  const { propiedades, meta } = resultadoBusqueda.data;

  return (
    <>
      <p className="catalogo__contador" role="status">
        {meta.total === 1 ? "1 propiedad encontrada" : `${meta.total} propiedades encontradas`}
      </p>

      {propiedades.length > 0 ? (
        <ul className="propiedad-grid">
          {propiedades.map((propiedad) => (
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

      <Paginacion paginaActual={meta.pagina} totalPaginas={meta.totalPaginas} buildHref={buildHrefPagina} />
    </>
  );
}
