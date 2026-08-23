"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TipoOperacion } from "@arrendadora/shared";
import {
  construirRutaCatalogo,
  hayFiltrosActivos as hayFiltrosActivosLib,
  type ValoresFiltrosCatalogo,
} from "@/lib/catalogo-filtros";

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
  /**
   * Variante de presentación (BUILD-040 §1.1 vs §1.2):
   *   - "natural" (default): grid 5 columnas con labels visibles.
   *   - "compact": 1 fila de 40px, labels con `.sr-only` (siguen en el DOM
   *     para lectores de pantalla — WCAG 4.1.2), altura reducida, CTA
   *     "Buscar" abreviado.
   */
  variant?: "natural" | "compact";
}

/**
 * Filtros de búsqueda (HU-001, RN-024 — acumulativos). Client Component: construye la query
 * string y navega con `router.push`, así la página (Server Component) se re-renderiza con los
 * `searchParams` nuevos sin recarga completa del documento. Los `<select>` se pueblan con
 * catálogos dinámicos (`/public/tipos-propiedad`, `/public/ciudades` — ADR-005, GAP-002).
 *
 * BUILD-040 §8.1: usa `construirRutaCatalogo()` como fuente única de verdad — la misma
 * función que consume `FiltrosMobileDrawer`. Zero duplicación de la lógica de URL.
 */
export function FiltrosCatalogoForm({
  tiposPropiedad,
  ciudades,
  valoresIniciales,
  variant = "natural",
}: FiltrosCatalogoFormProps) {
  const router = useRouter();
  const [tipoOperacion, setTipoOperacion] = useState(
    valoresIniciales.tipoOperacion ?? "",
  );
  const [tipoPropiedad, setTipoPropiedad] = useState(
    valoresIniciales.tipoPropiedad ?? "",
  );
  const [ciudad, setCiudad] = useState(valoresIniciales.ciudad ?? "");
  const [precioMin, setPrecioMin] = useState(
    valoresIniciales.precioMin?.toString() ?? "",
  );
  const [precioMax, setPrecioMax] = useState(
    valoresIniciales.precioMax?.toString() ?? "",
  );

  const snapshot: ValoresFiltrosCatalogo = {
    tipoOperacion,
    tipoPropiedad,
    ciudad,
    precioMin,
    precioMax,
  };
  const hayFiltrosActivos = hayFiltrosActivosLib(snapshot);

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    router.push(construirRutaCatalogo(snapshot));
  }

  const claseLabel = variant === "compact" ? "sr-only" : undefined;
  const claseFormExtra =
    variant === "compact" ? " filtros-catalogo--compacta" : "";
  const ctaTexto = variant === "compact" ? "Buscar" : "Buscar propiedades";

  return (
    <form
      className={`filtros-catalogo${claseFormExtra}`}
      onSubmit={manejarEnvio}
      role="search"
      aria-label="Filtros de búsqueda de propiedades"
      data-variant={variant}
    >
      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-operacion" className={claseLabel}>
          Operación
        </label>
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
        <label htmlFor="filtro-tipo-propiedad" className={claseLabel}>
          Tipo de inmueble
        </label>
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
        <label htmlFor="filtro-ciudad" className={claseLabel}>
          Ciudad
        </label>
        <select
          id="filtro-ciudad"
          value={ciudad}
          onChange={(evento) => setCiudad(evento.target.value)}
        >
          <option value="">Todas</option>
          {ciudades.map((opcion) => (
            <option key={opcion.ciudad} value={opcion.ciudad}>
              {opcion.ciudad} ({opcion.total})
            </option>
          ))}
        </select>
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-precio-min" className={claseLabel}>
          Precio mínimo (COP)
        </label>
        <input
          id="filtro-precio-min"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          placeholder="$"
          value={precioMin}
          onChange={(evento) => setPrecioMin(evento.target.value)}
        />
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-precio-max" className={claseLabel}>
          Precio máximo (COP)
        </label>
        <input
          id="filtro-precio-max"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          placeholder="$"
          value={precioMax}
          onChange={(evento) => setPrecioMax(evento.target.value)}
        />
      </div>

      <div className="filtros-catalogo__acciones">
        <button type="submit">{ctaTexto}</button>
        {hayFiltrosActivos ? (
          variant === "compact" ? (
            <a
              href="/"
              className="filtros-catalogo__limpiar-icon"
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </a>
          ) : (
            <a href="/" className="filtros-catalogo__limpiar">
              Limpiar filtros
            </a>
          )
        ) : null}
      </div>
    </form>
  );
}
