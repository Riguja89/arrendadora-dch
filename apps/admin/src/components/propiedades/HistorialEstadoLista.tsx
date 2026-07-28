import { useEffect, useState } from "react";
import { obtenerHistorialEstado } from "@/lib/propiedades-api";
import { ETIQUETAS_ESTADO } from "@/lib/estados-propiedad";
import { formatearFechaHora } from "@/lib/format";
import type { HistorialEstado } from "@/lib/propiedades-types";

interface HistorialEstadoListaProps {
  propiedadId: string;
}

/** Historial cronológico de cambios de estado — solo informativo (GAP-007, ADR-006). */
export function HistorialEstadoLista({ propiedadId }: HistorialEstadoListaProps) {
  const [historial, setHistorial] = useState<HistorialEstado[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();

    void (async () => {
      const resultado = await obtenerHistorialEstado(propiedadId, controlador.signal);
      if (cancelado) return;
      if (!resultado.ok) {
        setError(resultado.error.message);
        return;
      }
      setHistorial(resultado.data);
    })();

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [propiedadId]);

  if (error) {
    return (
      <p className="campo-error" role="alert">
        {error}
      </p>
    );
  }

  if (historial === null) {
    return <p className="texto-muted">Cargando historial…</p>;
  }

  if (historial.length === 0) {
    return <p className="texto-muted">Sin cambios de estado registrados todavía.</p>;
  }

  return (
    <table className="tabla-historial">
      <caption>Historial de estados (informativo)</caption>
      <thead>
        <tr>
          <th scope="col">Fecha</th>
          <th scope="col">De</th>
          <th scope="col">A</th>
          <th scope="col">Usuario</th>
          <th scope="col">Nota</th>
        </tr>
      </thead>
      <tbody>
        {historial.map((entrada) => (
          <tr key={entrada.id}>
            <td>{formatearFechaHora(entrada.cambiado_en)}</td>
            <td>{ETIQUETAS_ESTADO[entrada.estado_anterior]}</td>
            <td>{ETIQUETAS_ESTADO[entrada.estado_nuevo]}</td>
            <td>{entrada.usuario_nombre}</td>
            <td>{entrada.nota ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
