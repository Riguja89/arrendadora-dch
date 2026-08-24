"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  construirRutaCatalogo,
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

interface MiniFiltroLandingProps {
  tiposPropiedad: OpcionTipoPropiedad[];
  ciudades: OpcionCiudad[];
}

/**
 * Mini-filtro de la landing (HU-L02, RN-L03). NO muestra resultados: al enviar
 * construye la URL del catálogo con `construirRutaCatalogo()` (fuente única de
 * verdad, la misma que usa el catálogo) y redirige con `router.push()`.
 *
 * Degradación graciosa (RN-L04): si los catálogos de opciones no cargaron, los
 * selects quedan vacíos pero el botón sigue funcional (redirige a `/` sin
 * filtros si no se seleccionó nada). Todos los campos son opcionales.
 */
export function MiniFiltroLanding({ tiposPropiedad, ciudades }: MiniFiltroLandingProps) {
  const router = useRouter();
  const [tipoOperacion, setTipoOperacion] = useState("");
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valores: ValoresFiltrosCatalogo = {
      tipoOperacion,
      tipoPropiedad,
      ciudad,
      precioMin,
      precioMax,
    };
    router.push(construirRutaCatalogo(valores));
  }

  return (
    <section className="seccion seccion--pagina" aria-labelledby="mini-filtro-titulo">
      <div className="contenedor-landing mini-filtro">
        <h2 id="mini-filtro-titulo" className="seccion__titulo seccion__titulo--centrado">
          Busca tu propiedad ideal
        </h2>
        <p className="mini-filtro__intro">
          Encuentra lo que necesitas. Selecciona tus criterios y te llevamos directo al catálogo con
          los resultados.
        </p>

        <form
          className="mini-filtro__form"
          onSubmit={manejarEnvio}
          role="search"
          aria-label="Búsqueda rápida de propiedades"
        >
          <div className="mini-filtro__campos">
            <div className="mini-filtro__campo">
              <label htmlFor="mini-operacion">Operación</label>
              <select
                id="mini-operacion"
                value={tipoOperacion}
                onChange={(evento) => setTipoOperacion(evento.target.value)}
              >
                <option value="">Todas</option>
                <option value="arriendo">Arriendo</option>
                <option value="venta">Venta</option>
              </select>
            </div>

            <div className="mini-filtro__campo">
              <label htmlFor="mini-tipo">Tipo de inmueble</label>
              <select
                id="mini-tipo"
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

            <div className="mini-filtro__campo">
              <label htmlFor="mini-ciudad">Ciudad</label>
              <select
                id="mini-ciudad"
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

            <div className="mini-filtro__campo">
              <label htmlFor="mini-precio-min">Precio mínimo (COP)</label>
              <input
                id="mini-precio-min"
                type="number"
                inputMode="numeric"
                min={0}
                step={10000}
                placeholder="$"
                value={precioMin}
                onChange={(evento) => setPrecioMin(evento.target.value)}
              />
            </div>

            <div className="mini-filtro__campo">
              <label htmlFor="mini-precio-max">Precio máximo (COP)</label>
              <input
                id="mini-precio-max"
                type="number"
                inputMode="numeric"
                min={0}
                step={10000}
                placeholder="$"
                value={precioMax}
                onChange={(evento) => setPrecioMax(evento.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="mini-filtro__cta">
            Buscar propiedades
          </button>
        </form>
      </div>
    </section>
  );
}
