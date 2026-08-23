"use client";

import { useEffect, useReducer, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/primitivos/bottom-sheet";
import {
  construirRutaCatalogo,
  type ValoresFiltrosCatalogo,
  type ValoresInicialesFiltros,
} from "@/lib/catalogo-filtros";
import {
  crearEstadoInicial,
  reducerDrawerFiltros,
} from "@/lib/bottom-sheet-state";

interface OpcionTipoPropiedad {
  id: string;
  nombre: string;
}

interface OpcionCiudad {
  ciudad: string;
  total: number;
}

interface FiltrosMobileDrawerProps {
  tiposPropiedad: OpcionTipoPropiedad[];
  ciudades: OpcionCiudad[];
  valoresIniciales: ValoresInicialesFiltros;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ID del panel — el `aria-controls` del FAB debe apuntar aquí. */
  sheetId: string;
}

/**
 * Drawer mobile de filtros (BUILD-040 §2.3 y §8.1.3).
 *
 * Estado local del `borrador` gestionado con `useReducer(reducerDrawerFiltros)`:
 *   - Al abrir: rehidrata borrador con los valores ya aplicados.
 *   - Editar: solo toca el borrador.
 *   - Cerrar sin submit: descarta el borrador.
 *   - Aplicar: promueve borrador → aplicados y `router.push` a la ruta que
 *     devuelve `construirRutaCatalogo`.
 */
export function FiltrosMobileDrawer({
  tiposPropiedad,
  ciudades,
  valoresIniciales,
  open,
  onOpenChange,
  sheetId,
}: FiltrosMobileDrawerProps) {
  const router = useRouter();
  const [estado, dispatch] = useReducer(
    reducerDrawerFiltros,
    valoresIniciales,
    crearEstadoInicial,
  );

  // Cada apertura re-sincroniza el borrador con lo aplicado (contrato §8.3.2).
  useEffect(() => {
    if (open && !estado.abierto) dispatch({ tipo: "abrir" });
    if (!open && estado.abierto) dispatch({ tipo: "descartar" });
  }, [open, estado.abierto]);

  function handleOpenChange(nuevoOpen: boolean) {
    if (!nuevoOpen) dispatch({ tipo: "descartar" });
    onOpenChange(nuevoOpen);
  }

  function actualizarCampo(
    campo: keyof ValoresFiltrosCatalogo,
    valor: string,
  ) {
    dispatch({ tipo: "cambiar-campo", campo, valor });
  }

  function manejarSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // Snapshot final del borrador — reducer lo va a promover a aplicados.
    const rutaDestino = construirRutaCatalogo(estado.borrador);
    dispatch({ tipo: "aplicar" });
    onOpenChange(false);
    router.push(rutaDestino);
  }

  function limpiarFiltros() {
    // Reset del borrador: cambiamos los 5 campos a "". No cerramos el sheet —
    // el usuario decide si aplica los filtros vacíos con "Buscar" o cierra.
    actualizarCampo("tipoOperacion", "");
    actualizarCampo("tipoPropiedad", "");
    actualizarCampo("ciudad", "");
    actualizarCampo("precioMin", "");
    actualizarCampo("precioMax", "");
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      id={sheetId}
      titulo="Filtros de búsqueda"
      cerrarLabel="Cerrar filtros"
    >
      <form
        className="filtros-drawer-form"
        onSubmit={manejarSubmit}
        role="search"
        aria-label="Filtros de búsqueda de propiedades"
      >
        <div className="filtros-drawer-form__campo">
          <label htmlFor="drawer-filtro-operacion">Operación</label>
          <select
            id="drawer-filtro-operacion"
            value={estado.borrador.tipoOperacion}
            onChange={(evento) =>
              actualizarCampo("tipoOperacion", evento.target.value)
            }
          >
            <option value="">Todas</option>
            <option value="arriendo">Arriendo</option>
            <option value="venta">Venta</option>
          </select>
        </div>

        <div className="filtros-drawer-form__campo">
          <label htmlFor="drawer-filtro-tipo-propiedad">Tipo de inmueble</label>
          <select
            id="drawer-filtro-tipo-propiedad"
            value={estado.borrador.tipoPropiedad}
            onChange={(evento) =>
              actualizarCampo("tipoPropiedad", evento.target.value)
            }
          >
            <option value="">Todos</option>
            {tiposPropiedad.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtros-drawer-form__campo">
          <label htmlFor="drawer-filtro-ciudad">Ciudad</label>
          <select
            id="drawer-filtro-ciudad"
            value={estado.borrador.ciudad}
            onChange={(evento) =>
              actualizarCampo("ciudad", evento.target.value)
            }
          >
            <option value="">Todas</option>
            {ciudades.map((opcion) => (
              <option key={opcion.ciudad} value={opcion.ciudad}>
                {opcion.ciudad} ({opcion.total})
              </option>
            ))}
          </select>
        </div>

        <div className="filtros-drawer-form__campo">
          <label htmlFor="drawer-filtro-precio-min">
            Precio mínimo (COP)
          </label>
          <input
            id="drawer-filtro-precio-min"
            type="number"
            inputMode="numeric"
            min={0}
            step={10000}
            placeholder="$"
            value={estado.borrador.precioMin}
            onChange={(evento) =>
              actualizarCampo("precioMin", evento.target.value)
            }
          />
        </div>

        <div className="filtros-drawer-form__campo">
          <label htmlFor="drawer-filtro-precio-max">
            Precio máximo (COP)
          </label>
          <input
            id="drawer-filtro-precio-max"
            type="number"
            inputMode="numeric"
            min={0}
            step={10000}
            placeholder="$"
            value={estado.borrador.precioMax}
            onChange={(evento) =>
              actualizarCampo("precioMax", evento.target.value)
            }
          />
        </div>

        <div className="filtros-drawer-form__acciones">
          <button
            type="submit"
            className="filtros-drawer-form__cta"
          >
            Buscar propiedades
          </button>
          <button
            type="button"
            className="filtros-drawer-form__limpiar"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
