import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { TipoOperacion, Usuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import {
  archivarPropiedad,
  duplicarPropiedad,
  listarAgentesActivos,
  listarPropiedades,
  listarTiposPropiedad,
  restaurarPropiedad,
} from "@/lib/propiedades-api";
import { ETIQUETAS_ESTADO } from "@/lib/estados-propiedad";
import { formatearPrecioCOP } from "@/lib/format";
import type { EstadoPropiedad, PaginacionMetaWire, Propiedad, TipoPropiedadCatalogo } from "@/lib/propiedades-types";

const ESTADOS: EstadoPropiedad[] = ["disponible", "reservada", "arrendada_vendida"];

/**
 * Listado interno de propiedades — spec-003 CU-005, HU-004. Filtros y paginación viven en la URL
 * (query params) para poder compartir/recargar sin perder el estado. `Agente` recibe del backend
 * solo sus propiedades (contrato DESIGN-028); el filtro por agente es exclusivo de Administrador
 * (HU-004 DoD).
 */
export function PropiedadesPage() {
  const { rol } = useAuth();
  const navegar = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const estado = (searchParams.get("estado") as EstadoPropiedad | null) ?? "";
  const tipoOperacion = (searchParams.get("tipo_operacion") as TipoOperacion | null) ?? "";
  const tipoPropiedadId = searchParams.get("tipo_propiedad_id") ?? "";
  const agenteFiltro = searchParams.get("agente") ?? "";
  const archivada = searchParams.get("archivada") === "true";
  const q = searchParams.get("q") ?? "";
  const pagina = Number(searchParams.get("pagina") ?? "1") || 1;

  const [propiedades, setPropiedades] = useState<Propiedad[] | null>(null);
  const [meta, setMeta] = useState<PaginacionMetaWire | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipos, setTipos] = useState<TipoPropiedadCatalogo[]>([]);
  const [agentes, setAgentes] = useState<Usuario[]>([]);
  const [accionando, setAccionando] = useState<string | null>(null);

  const [textoBusqueda, setTextoBusqueda] = useState(q);

  // Catálogos para los selects de filtro — se cargan una vez (y de nuevo si cambia el rol).
  useEffect(() => {
    const controlador = new AbortController();
    let cancelado = false;
    void (async () => {
      const tiposResp = await listarTiposPropiedad(controlador.signal);
      if (cancelado) return;
      if (tiposResp.ok) setTipos(tiposResp.data);
      if (rol === "administrador") {
        const agentesResp = await listarAgentesActivos(controlador.signal);
        if (cancelado) return;
        if (agentesResp.ok) setAgentes(agentesResp.data);
      }
    })();
    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [rol]);

  // Listado — se refresca en cada cambio de filtros/paginación (URL como fuente de verdad).
  useEffect(() => {
    const controlador = new AbortController();
    let cancelado = false;
    setCargando(true);
    setError(null);

    void (async () => {
      const resultado = await listarPropiedades(
        {
          estado: estado || undefined,
          tipo_operacion: tipoOperacion || undefined,
          tipo_propiedad_id: tipoPropiedadId || undefined,
          agente: agenteFiltro || undefined,
          archivada,
          q: q || undefined,
          pagina,
          tamano_pagina: 20,
        },
        controlador.signal,
      );
      // Una petición cancelada (unmount, StrictMode double-invoke o cambio de filtro
      // mientras esta seguía en vuelo) NO es un error — la ignoramos sin tocar el estado.
      if (cancelado) return;
      if (!resultado.ok) {
        setError(resultado.error.message);
        setCargando(false);
        return;
      }
      const { data, ...paginacionMeta } = resultado.data;
      setPropiedades(data);
      setMeta(paginacionMeta);
      setCargando(false);
    })();

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [estado, tipoOperacion, tipoPropiedadId, agenteFiltro, archivada, q, pagina]);

  function actualizarFiltro(clave: string, valor: string): void {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    params.set("pagina", "1");
    setSearchParams(params);
  }

  function manejarBusqueda(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    actualizarFiltro("q", textoBusqueda);
  }

  function limpiarFiltros(): void {
    setTextoBusqueda("");
    setSearchParams({});
  }

  function irAPagina(nuevaPagina: number): void {
    const params = new URLSearchParams(searchParams);
    params.set("pagina", String(nuevaPagina));
    setSearchParams(params);
  }

  function actualizarPropiedadEnLista(actualizada: Propiedad): void {
    setPropiedades((actual) => actual?.map((p) => (p.id === actualizada.id ? actualizada : p)) ?? actual);
  }

  async function manejarArchivar(id: string): Promise<void> {
    if (!window.confirm("¿Archivar esta propiedad? Dejará de ser visible en el portal público.")) return;
    setAccionando(id);
    const resultado = await archivarPropiedad(id);
    setAccionando(null);
    if (!resultado.ok) {
      window.alert(resultado.error.message);
      return;
    }
    void actualizarPropiedadEnLista(resultado.data);
    // Si el filtro actual excluye archivadas, la propiedad ya no debería listarse.
    if (!archivada) setPropiedades((actual) => actual?.filter((p) => p.id !== id) ?? actual);
  }

  async function manejarRestaurar(id: string): Promise<void> {
    setAccionando(id);
    const resultado = await restaurarPropiedad(id);
    setAccionando(null);
    if (!resultado.ok) {
      window.alert(resultado.error.message);
      return;
    }
    void actualizarPropiedadEnLista(resultado.data);
    if (archivada) setPropiedades((actual) => actual?.filter((p) => p.id !== id) ?? actual);
  }

  /**
   * HU-003 (RN-026) — duplica la propiedad y lleva al Agente/Editor/Administrador directo a la
   * edición de la copia (CU-002 flujo alternativo). Acción aditiva y no destructiva — sin
   * confirmación previa, a diferencia de archivar (que sí oculta la propiedad del portal).
   */
  async function manejarDuplicar(id: string): Promise<void> {
    setAccionando(id);
    const resultado = await duplicarPropiedad(id);
    setAccionando(null);
    if (!resultado.ok) {
      window.alert(resultado.error.message);
      return;
    }
    navegar(`/propiedades/${resultado.data.id}/editar`);
  }

  return (
    <section>
      <div className="propiedades-page__header">
        <h2>Propiedades</h2>
        <Link to="/propiedades/nueva" className="boton-primario">
          Nueva propiedad
        </Link>
      </div>

      <form className="propiedades-filtros" onSubmit={manejarBusqueda}>
        <div className="campo">
          <label htmlFor="filtro-q">Buscar</label>
          <input
            id="filtro-q"
            value={textoBusqueda}
            placeholder="Título, código o dirección…"
            onChange={(e) => setTextoBusqueda(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={estado} onChange={(e) => actualizarFiltro("estado", e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtro-tipo-operacion">Tipo de operación</label>
          <select
            id="filtro-tipo-operacion"
            value={tipoOperacion}
            onChange={(e) => actualizarFiltro("tipo_operacion", e.target.value)}
          >
            <option value="">Todas</option>
            <option value="arriendo">Arriendo</option>
            <option value="venta">Venta</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtro-tipo-propiedad">Tipo de propiedad</label>
          <select
            id="filtro-tipo-propiedad"
            value={tipoPropiedadId}
            onChange={(e) => actualizarFiltro("tipo_propiedad_id", e.target.value)}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {rol === "administrador" ? (
          <div className="campo">
            <label htmlFor="filtro-agente">Agente</label>
            <select id="filtro-agente" value={agenteFiltro} onChange={(e) => actualizarFiltro("agente", e.target.value)}>
              <option value="">Todos</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="campo campo--checkbox">
          <label htmlFor="filtro-archivada">
            <input
              id="filtro-archivada"
              type="checkbox"
              checked={archivada}
              onChange={(e) => actualizarFiltro("archivada", e.target.checked ? "true" : "")}
            />
            Mostrar archivadas
          </label>
        </div>

        <div className="propiedades-filtros__acciones">
          <button type="submit">Buscar</button>
          <button type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {cargando ? <p className="texto-muted">Cargando propiedades…</p> : null}
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}

      {!cargando && !error && propiedades !== null ? (
        propiedades.length === 0 ? (
          <p className="texto-muted">
            No hay propiedades con esos filtros.{" "}
            <button type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </p>
        ) : (
          <>
            <table className="tabla-propiedades">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Título</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Ciudad</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.map((propiedad) => (
                  <tr key={propiedad.id}>
                    <td>{propiedad.codigo}</td>
                    <td>{propiedad.titulo}</td>
                    <td>{propiedad.tipo_operacion === "arriendo" ? "Arriendo" : "Venta"}</td>
                    <td>{propiedad.ciudad}</td>
                    <td>{formatearPrecioCOP(propiedad.precio)}</td>
                    <td>
                      <span className={`badge badge--estado-${propiedad.estado}`}>{ETIQUETAS_ESTADO[propiedad.estado]}</span>
                      {propiedad.archivada ? <span className="badge badge--archivada">Archivada</span> : null}
                    </td>
                    <td className="tabla-propiedades__acciones">
                      <Link to={`/propiedades/${propiedad.id}/editar`}>Editar</Link>
                      <button type="button" disabled={accionando === propiedad.id} onClick={() => void manejarDuplicar(propiedad.id)}>
                        Duplicar
                      </button>
                      {!propiedad.archivada && (rol === "administrador" || rol === "editor") ? (
                        <button type="button" disabled={accionando === propiedad.id} onClick={() => void manejarArchivar(propiedad.id)}>
                          Archivar
                        </button>
                      ) : null}
                      {propiedad.archivada && rol === "administrador" ? (
                        <button type="button" disabled={accionando === propiedad.id} onClick={() => void manejarRestaurar(propiedad.id)}>
                          Restaurar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.total_paginas > 1 ? (
              <nav className="paginacion" aria-label="Paginación de propiedades">
                <button type="button" disabled={pagina <= 1} onClick={() => irAPagina(pagina - 1)}>
                  Anterior
                </button>
                <span>
                  Página {meta.pagina} de {meta.total_paginas} ({meta.total} propiedades)
                </span>
                <button type="button" disabled={pagina >= meta.total_paginas} onClick={() => irAPagina(pagina + 1)}>
                  Siguiente
                </button>
              </nav>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
