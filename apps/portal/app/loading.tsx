/**
 * Fallback de Suspense global del portal (App Router). Next lo muestra automáticamente
 * durante cualquier navegación entre segmentos (home, catálogo por ciudad, ficha de
 * detalle) mientras el servidor resuelve el SSR sin caché de la ruta destino.
 */
export default function Cargando() {
  return (
    <div className="cargando-portal" role="status" aria-live="polite">
      <span className="cargando-portal__spinner" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
