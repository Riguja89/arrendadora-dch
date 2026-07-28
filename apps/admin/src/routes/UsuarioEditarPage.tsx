import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { EstadoUsuarioControl } from "@/components/usuarios/EstadoUsuarioControl";
import { obtenerUsuario } from "@/lib/usuarios-api";
import type { Usuario } from "@arrendadora/shared";

/**
 * CU-004 — edición de usuario (HU-004): nombre, rol, WhatsApp y estado. El email no es editable
 * (ANALYZE-005). Un 403/404 del backend se muestra tal cual, sin bypass en el cliente.
 */
export function UsuarioEditarPage() {
  const { id } = useParams<{ id: string }>();
  const { usuario: usuarioSesion } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controlador = new AbortController();
    setCargando(true);
    setError(null);

    void (async () => {
      const resultado = await obtenerUsuario(id, controlador.signal);
      if (!resultado.ok) {
        setError(resultado.error.message);
        setCargando(false);
        return;
      }
      setUsuario(resultado.data);
      setCargando(false);
    })();

    return () => controlador.abort();
  }, [id]);

  if (!id) return null;

  if (cargando) {
    return (
      <section>
        <p className="texto-muted">Cargando usuario…</p>
      </section>
    );
  }

  if (error || !usuario) {
    return (
      <section>
        <p className="campo-error" role="alert">
          {error ?? "No se pudo cargar el usuario."}
        </p>
        <Link to="/usuarios">Volver al listado</Link>
      </section>
    );
  }

  return (
    <section>
      <h2>
        Editar usuario <span className="texto-muted">({usuario.email})</span>
      </h2>

      <EstadoUsuarioControl usuario={usuario} esPropio={usuario.id === usuarioSesion?.id} onCambiado={setUsuario} />

      <UsuarioForm modo="editar" usuario={usuario} onGuardado={setUsuario} />

      <p>
        <Link to="/usuarios">Volver al listado</Link>
      </p>
    </section>
  );
}
