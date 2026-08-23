import { useState } from "react";
import type { Usuario } from "@arrendadora/shared";
import { cambiarEstadoUsuario } from "@/lib/usuarios-api";
import { accionDisponible, ETIQUETAS_ACCION_ESTADO, ETIQUETAS_ESTADO_USUARIO, mensajeConfirmacionAccion } from "@/lib/estados-usuario";

interface EstadoUsuarioControlProps {
  usuario: Usuario;
  /** `true` si `usuario` es la sesión actual — auto-protección (CU-004 5a): no puede desactivarse a sí mismo. */
  esPropio: boolean;
  onCambiado: (actualizado: Usuario) => void;
  /** Oculta el badge de estado — usado en el listado, donde la columna "Estado" ya lo muestra (HU-004 DoD). */
  mostrarBadge?: boolean;
}

/**
 * Control de activar/desactivar/desbloquear (spec-005 CU-004, HU-004). Solo ofrece la acción
 * válida para el estado actual (`estados-usuario.ts`) — la autoridad real vive en el backend; un
 * 409 aquí (`AccionEstadoInvalidaError`/`AutoproteccionAdministradorError`) se muestra tal cual.
 */
export function EstadoUsuarioControl({ usuario, esPropio, onCambiado, mostrarBadge = true }: EstadoUsuarioControlProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accion = accionDisponible(usuario.estado);
  // Auto-protección (CU-004 5a): el Administrador no puede desactivar su propia cuenta.
  const ocultarAccion = esPropio && accion === "desactivar";

  async function manejarClick(): Promise<void> {
    if (!accion) return;
    if (!window.confirm(mensajeConfirmacionAccion(accion, usuario.nombre))) return;

    setError(null);
    setEnviando(true);
    const resultado = await cambiarEstadoUsuario(usuario.id, accion);
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error.message);
      return;
    }
    onCambiado(resultado.data);
  }

  return (
    <div className={mostrarBadge ? "estado-usuario-control" : "estado-usuario-control estado-usuario-control--compacto"}>
      {mostrarBadge ? (
        <p>
          Estado actual:{" "}
          <span className={`badge badge--estado-usuario-${usuario.estado}`}>{ETIQUETAS_ESTADO_USUARIO[usuario.estado]}</span>
        </p>
      ) : null}
      {accion && !ocultarAccion ? (
        <button type="button" disabled={enviando} onClick={() => void manejarClick()}>
          {ETIQUETAS_ACCION_ESTADO[accion]}
        </button>
      ) : null}
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
