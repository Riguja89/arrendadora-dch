import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cambiarEstadoPropiedad } from "@/lib/propiedades-api";
import { ETIQUETAS_ESTADO, mensajeConfirmacion, requiereConfirmacion, transicionesPermitidas } from "@/lib/estados-propiedad";
import type { Propiedad } from "@/lib/propiedades-types";

interface EstadoPropiedadControlProps {
  propiedad: Propiedad;
  onCambiado: (actualizada: Propiedad) => void;
}

/**
 * Control de cambio de estado (spec-003 CU-003, RN-012, ADR-006). Solo ofrece las transiciones
 * válidas para el estado actual y el rol de la sesión (ADR-014) — la autoridad real vive en el
 * backend; un 409 aquí significa que la transición dejó de ser válida entretanto (carrera con
 * otro usuario) y se muestra tal cual.
 */
export function EstadoPropiedadControl({ propiedad, onCambiado }: EstadoPropiedadControlProps) {
  const { rol } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opciones = transicionesPermitidas(propiedad.estado, rol);

  async function manejarCambio(estadoNuevo: Propiedad["estado"]): Promise<void> {
    if (requiereConfirmacion(propiedad.estado, estadoNuevo)) {
      const confirmado = window.confirm(mensajeConfirmacion(propiedad.estado, estadoNuevo));
      if (!confirmado) return;
    }

    setError(null);
    setEnviando(true);
    const resultado = await cambiarEstadoPropiedad(propiedad.id, { estado_nuevo: estadoNuevo });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error.message);
      return;
    }
    onCambiado(resultado.data);
  }

  return (
    <div className="estado-control">
      <p>
        Estado actual:{" "}
        <span className={`badge badge--estado-${propiedad.estado}`}>{ETIQUETAS_ESTADO[propiedad.estado]}</span>
      </p>
      {opciones.length > 0 ? (
        <div className="estado-control__acciones">
          {opciones.map((estado) => (
            <button key={estado} type="button" disabled={enviando} onClick={() => void manejarCambio(estado)}>
              Cambiar a {ETIQUETAS_ESTADO[estado]}
            </button>
          ))}
        </div>
      ) : (
        <p className="texto-muted">No hay transiciones de estado disponibles para tu rol.</p>
      )}
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
