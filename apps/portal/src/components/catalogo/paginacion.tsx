import Link from "next/link";

interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  /** Construye el `href` de una página dada, preservando los filtros activos (query string). */
  buildHref: (pagina: number) => string;
}

/** Controles de paginación del listado (CU-002, "nota de alcance": paginación por página). */
export function Paginacion({ paginaActual, totalPaginas, buildHref }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  const anterior = paginaActual > 1 ? paginaActual - 1 : null;
  const siguiente = paginaActual < totalPaginas ? paginaActual + 1 : null;

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      {anterior ? (
        <Link href={buildHref(anterior)} rel="prev">
          « Anterior
        </Link>
      ) : (
        <span className="paginacion__deshabilitado" aria-disabled="true">
          « Anterior
        </span>
      )}

      <span className="paginacion__estado" aria-current="page">
        Página {paginaActual} de {totalPaginas}
      </span>

      {siguiente ? (
        <Link href={buildHref(siguiente)} rel="next">
          Siguiente »
        </Link>
      ) : (
        <span className="paginacion__deshabilitado" aria-disabled="true">
          Siguiente »
        </span>
      )}
    </nav>
  );
}
