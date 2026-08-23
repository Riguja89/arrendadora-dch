import {
  contarFiltrosActivos,
  valoresInicialesAEstado,
  VALORES_FILTROS_VACIOS,
  type ValoresFiltrosCatalogo,
  type ValoresInicialesFiltros,
} from "./catalogo-filtros";

/**
 * State machine puro del bottom sheet + drawer de filtros mobile
 * (BUILD-040 §8.3.2 y §8.3.4).
 *
 * Contratos que aplica:
 *   - Apertura: el drawer se rehidrata con `valoresAplicados` (los que ya
 *     están en la URL). El estado local `borrador` refleja lo que el usuario
 *     está tocando ANTES de submit.
 *   - Cierre por descarte (X, overlay, Escape, drag): se restaura el
 *     `borrador` a `valoresAplicados` — los cambios se pierden.
 *   - Cierre por aplicar (submit "Buscar propiedades"): `valoresAplicados`
 *     pasa a ser lo que estaba en `borrador` (el caller navega con la URL
 *     derivada de ese snapshot).
 *
 * Se extrae como reducer para poder testearlo sin renderizar React ni
 * necesitar jsdom.
 */

export interface EstadoDrawerFiltros {
  /** `true` cuando el bottom sheet está montado y visible. */
  abierto: boolean;
  /** Snapshot ya reflejado en la URL — la fuente de verdad "aplicada". */
  valoresAplicados: ValoresFiltrosCatalogo;
  /** Snapshot en edición dentro del drawer. Se pierde al cerrar sin submit. */
  borrador: ValoresFiltrosCatalogo;
}

export type AccionDrawerFiltros =
  | { tipo: "abrir" }
  /** Cerrar sin aplicar — descarta borrador (X, overlay, Escape, drag). */
  | { tipo: "descartar" }
  /**
   * El usuario cambió un campo del borrador. `key` es una llave tipada de
   * `ValoresFiltrosCatalogo` — así el reducer siempre modifica solo campos
   * legítimos y TypeScript verifica el pareo.
   */
  | { tipo: "cambiar-campo"; campo: keyof ValoresFiltrosCatalogo; valor: string }
  /**
   * Aplicar los filtros del borrador. El reducer promueve `borrador` a
   * `valoresAplicados` y cierra el drawer. El caller es quien navega la URL
   * derivada de `estado.valoresAplicados` (ver `construirRutaCatalogo`).
   */
  | { tipo: "aplicar" }
  /**
   * Sincronización externa: los `searchParams` cambiaron por navegación
   * server-side y hay que actualizar `valoresAplicados` (y borrador si el
   * drawer está cerrado).
   */
  | { tipo: "sincronizar-desde-url"; iniciales: ValoresInicialesFiltros };

/**
 * Estado inicial parametrizado — se calcula desde los `valoresIniciales`
 * (los que vienen de los `searchParams` del server component).
 */
export function crearEstadoInicial(
  iniciales: ValoresInicialesFiltros = {},
): EstadoDrawerFiltros {
  const snapshot = valoresInicialesAEstado(iniciales);
  return {
    abierto: false,
    valoresAplicados: snapshot,
    borrador: snapshot,
  };
}

export function reducerDrawerFiltros(
  estado: EstadoDrawerFiltros,
  accion: AccionDrawerFiltros,
): EstadoDrawerFiltros {
  switch (accion.tipo) {
    case "abrir":
      // Cada apertura resincroniza el borrador con los valores aplicados —
      // si el usuario abrió, cerró, y volvió a abrir, ve el estado real.
      return {
        ...estado,
        abierto: true,
        borrador: estado.valoresAplicados,
      };
    case "descartar":
      // Cierre sin aplicar: descartamos el borrador y volvemos al último
      // snapshot aplicado. Cerrando siempre queda coherente con la URL.
      return {
        ...estado,
        abierto: false,
        borrador: estado.valoresAplicados,
      };
    case "cambiar-campo":
      return {
        ...estado,
        borrador: {
          ...estado.borrador,
          [accion.campo]: accion.valor,
        },
      };
    case "aplicar":
      return {
        abierto: false,
        valoresAplicados: estado.borrador,
        borrador: estado.borrador,
      };
    case "sincronizar-desde-url": {
      const snapshot = valoresInicialesAEstado(accion.iniciales);
      return estado.abierto
        ? { ...estado, valoresAplicados: snapshot }
        : { abierto: false, valoresAplicados: snapshot, borrador: snapshot };
    }
    default: {
      // Guardia exhaustivo — si se agrega una acción nueva sin caso el
      // typechecker lo grita en compile time.
      const _exhaustive: never = accion;
      return _exhaustive;
    }
  }
}

/**
 * Helper de UI: cuántos filtros están aplicados HOY (los que se ven en la
 * URL y disparan el badge del FAB). NO cuenta el borrador — el badge solo
 * refleja lo que la búsqueda ya trajo.
 */
export function conteoBadgeDrawer(estado: EstadoDrawerFiltros): number {
  return contarFiltrosActivos(estado.valoresAplicados);
}

/** Alias re-exportado para conveniencia del caller. */
export { VALORES_FILTROS_VACIOS };
