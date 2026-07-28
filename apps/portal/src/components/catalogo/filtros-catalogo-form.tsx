"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TipoOperacion } from "@arrendadora/shared";
import { construirHrefCatalogoSegmento, esOperacionValida } from "@/lib/rutas";

interface OpcionTipoPropiedad {
  id: string;
  nombre: string;
}

interface OpcionCiudad {
  ciudad: string;
  total: number;
}

interface ValoresIniciales {
  tipoOperacion?: TipoOperacion;
  tipoPropiedad?: string;
  ciudad?: string;
  precioMin?: number;
  precioMax?: number;
}

interface FiltrosCatalogoFormProps {
  tiposPropiedad: OpcionTipoPropiedad[];
  ciudades: OpcionCiudad[];
  valoresIniciales: ValoresIniciales;
}

/**
 * Filtros de búsqueda (HU-001, RN-024 — acumulativos). Client Component: construye la query
 * string y navega con `router.push`, así la página (Server Component) se re-renderiza con los
 * `searchParams` nuevos sin recarga completa del documento. Los `<select>` se pueblan con
 * catálogos dinámicos (`/public/tipos-propiedad`, `/public/ciudades` — ADR-005, GAP-002).
 */
export function FiltrosCatalogoForm({ tiposPropiedad, ciudades, valoresIniciales }: FiltrosCatalogoFormProps) {
  const router = useRouter();
  const [tipoOperacion, setTipoOperacion] = useState(valoresIniciales.tipoOperacion ?? "");
  const [tipoPropiedad, setTipoPropiedad] = useState(valoresIniciales.tipoPropiedad ?? "");
  const [ciudad, setCiudad] = useState(valoresIniciales.ciudad ?? "");
  const [precioMin, setPrecioMin] = useState(valoresIniciales.precioMin?.toString() ?? "");
  const [precioMax, setPrecioMax] = useState(valoresIniciales.precioMax?.toString() ?? "");

  const hayFiltrosActivos = Boolean(tipoOperacion || tipoPropiedad || ciudad || precioMin || precioMax);

  /**
   * Navega a la ruta canónica indexable `/propiedades/{operacion}/{ciudad}` (ADR-010, ADR-018
   * Decisión 1) cuando el visitante completó operación **y** ciudad — los dos ejes que el
   * cliente pidió rankear (GAP-005). El resto de filtros (RN-024) se preservan como query params
   * sobre esa ruta. Si falta alguno de los dos, la búsqueda se queda en `/` con query params
   * (comportamiento acumulativo actual) — no existe página canónica para una búsqueda parcial.
   */
  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (esOperacionValida(tipoOperacion) && ciudad) {
      const paramsRestantes = new URLSearchParams();
      if (tipoPropiedad) paramsRestantes.set("tipo_propiedad", tipoPropiedad);
      if (precioMin) paramsRestantes.set("precio_min", precioMin);
      if (precioMax) paramsRestantes.set("precio_max", precioMax);
      const query = paramsRestantes.toString();
      const rutaCanonica = construirHrefCatalogoSegmento(tipoOperacion, ciudad);
      router.push(query ? `${rutaCanonica}?${query}` : rutaCanonica);
      return;
    }

    const params = new URLSearchParams();
    if (tipoOperacion) params.set("tipo_operacion", tipoOperacion);
    if (tipoPropiedad) params.set("tipo_propiedad", tipoPropiedad);
    if (ciudad) params.set("ciudad", ciudad);
    if (precioMin) params.set("precio_min", precioMin);
    if (precioMax) params.set("precio_max", precioMax);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <form
      className="filtros-catalogo"
      onSubmit={manejarEnvio}
      role="search"
      aria-label="Filtros de búsqueda de propiedades"
    >
      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-operacion">Operación</label>
        <select
          id="filtro-operacion"
          value={tipoOperacion}
          onChange={(evento) => setTipoOperacion(evento.target.value)}
        >
          <option value="">Todas</option>
          <option value="arriendo">Arriendo</option>
          <option value="venta">Venta</option>
        </select>
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-tipo-propiedad">Tipo de inmueble</label>
        <select
          id="filtro-tipo-propiedad"
          value={tipoPropiedad}
          onChange={(evento) => setTipoPropiedad(evento.target.value)}
        >
          <option value="">Todos</option>
          {tiposPropiedad.map((tipo) => (
            <option key={tipo.id} value={tipo.nombre}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-ciudad">Ciudad</label>
        <select id="filtro-ciudad" value={ciudad} onChange={(evento) => setCiudad(evento.target.value)}>
          <option value="">Todas</option>
          {ciudades.map((opcion) => (
            <option key={opcion.ciudad} value={opcion.ciudad}>
              {opcion.ciudad} ({opcion.total})
            </option>
          ))}
        </select>
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-precio-min">Precio mínimo (COP)</label>
        <input
          id="filtro-precio-min"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          value={precioMin}
          onChange={(evento) => setPrecioMin(evento.target.value)}
        />
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-precio-max">Precio máximo (COP)</label>
        <input
          id="filtro-precio-max"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          value={precioMax}
          onChange={(evento) => setPrecioMax(evento.target.value)}
        />
      </div>

      <div className="filtros-catalogo__acciones">
        <button type="submit">Buscar</button>
        {hayFiltrosActivos ? (
          <a href="/" className="filtros-catalogo__limpiar">
            Limpiar filtros
          </a>
        ) : null}
      </div>
    </form>
  );
}
