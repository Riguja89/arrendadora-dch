import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { EstadoUsuario, RolUsuario, Usuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import { listarUsuarios } from "@/lib/usuarios-api";
import { ETIQUETAS_ESTADO_USUARIO, ETIQUETAS_ROL } from "@/lib/estados-usuario";
import { EstadoUsuarioControl } from "@/components/usuarios/EstadoUsuarioControl";

const ROLES: RolUsuario[] = ["administrador", "agente", "editor"];
const ESTADOS: EstadoUsuario[] = ["activo", "desactivado", "bloqueado"];

/**
 * Listado de usuarios internos — spec-005 CU-004, HU-004. Solo alcanzable por Administrador
 * (`RequireRole` en `App.tsx`, matriz ADR-014). Filtros y paginación viven en la URL (mismo
 * criterio que `PropiedadesPage`); el listado distingue visualmente activos/desactivados/
 * bloqueados con el badge de estado (HU-004 DoD).
 */
export function UsuariosPage() {
  const { usuario: usuarioSesion } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const rol = (searchParams.get("rol") as RolUsuario | null) ?? "";
  const estado = (searchParams.get("estado") as EstadoUsuario | null) ?? "";
  const pagina = Number(searchParams.get("pagina") ?? "1") || 1;

  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [meta, setMeta] = useState<{ pagina: number; total: number; total_paginas: number } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError(null);

    void (async () => {
      const resultado = await listarUsuarios(
        { rol: rol || undefined, estado: estado || undefined, pagina, tamano_pagina: 20 },
        controlador.signal,
      );
      if (!resultado.ok) {
        setError(resultado.error.message);
        setCargando(false);
        return;
      }
      setUsuarios(resultado.data.data);
      setMeta(resultado.data.meta);
      setCargando(false);
    })();

    return () => controlador.abort();
  }, [rol, estado, pagina]);

  function actualizarFiltro(clave: string, valor: string): void {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    params.set("pagina", "1");
    setSearchParams(params);
  }

  function limpiarFiltros(): void {
    setSearchParams({});
  }

  function irAPagina(nuevaPagina: number): void {
    const params = new URLSearchParams(searchParams);
    params.set("pagina", String(nuevaPagina));
    setSearchParams(params);
  }

  function actualizarUsuarioEnLista(actualizado: Usuario): void {
    setUsuarios((actual) => actual?.map((u) => (u.id === actualizado.id ? actualizado : u)) ?? actual);
  }

  return (
    <section>
      <div className="usuarios-page__header">
        <h2>Usuarios</h2>
        <Link to="/usuarios/nuevo" className="boton-primario">
          Nuevo usuario
        </Link>
      </div>

      <form className="usuarios-filtros" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="filtro-rol">Rol</label>
          <select id="filtro-rol" value={rol} onChange={(e) => actualizarFiltro("rol", e.target.value)}>
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ETIQUETAS_ROL[r]}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={estado} onChange={(e) => actualizarFiltro("estado", e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO_USUARIO[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="usuarios-filtros__acciones">
          <button type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {cargando ? <p className="texto-muted">Cargando usuarios…</p> : null}
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}

      {!cargando && !error && usuarios !== null ? (
        usuarios.length === 0 ? (
          <p className="texto-muted">
            No hay usuarios con esos filtros.{" "}
            <button type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </p>
        ) : (
          <>
            <table className="tabla-usuarios">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Email</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>{ETIQUETAS_ROL[usuario.rol]}</td>
                    <td>
                      <span className={`badge badge--estado-usuario-${usuario.estado}`}>
                        {ETIQUETAS_ESTADO_USUARIO[usuario.estado]}
                      </span>
                    </td>
                    <td className="tabla-usuarios__acciones">
                      <Link to={`/usuarios/${usuario.id}/editar`}>Editar</Link>
                      <EstadoUsuarioControl
                        usuario={usuario}
                        esPropio={usuario.id === usuarioSesion?.id}
                        onCambiado={actualizarUsuarioEnLista}
                        mostrarBadge={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.total_paginas > 1 ? (
              <nav className="paginacion" aria-label="Paginación de usuarios">
                <button type="button" disabled={pagina <= 1} onClick={() => irAPagina(pagina - 1)}>
                  Anterior
                </button>
                <span>
                  Página {meta.pagina} de {meta.total_paginas} ({meta.total} usuarios)
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
