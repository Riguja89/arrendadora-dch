import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PropiedadForm } from "@/components/propiedades/PropiedadForm";
import { EstadoPropiedadControl } from "@/components/propiedades/EstadoPropiedadControl";
import { UbicacionField } from "@/components/propiedades/UbicacionField";
import { FotosField } from "@/components/propiedades/FotosField";
import { HistorialEstadoLista } from "@/components/propiedades/HistorialEstadoLista";
import { obtenerPropiedad } from "@/lib/propiedades-api";
import type { Propiedad } from "@/lib/propiedades-types";

/**
 * CU-002 — edición de propiedad (HU-002/HU-004), más los sub-bloques de estado (CU-003, ADR-006),
 * ubicación (ADR-011) y galería de fotos (spec-004 CU-001/CU-002). El backend ya restringe el
 * detalle a las propias para Agente (RN-010); un 403/404 aquí se muestra tal cual, sin intento de
 * bypass en el cliente.
 */
export function PropiedadEditarPage() {
  const { id } = useParams<{ id: string }>();
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controlador = new AbortController();
    setCargando(true);
    setError(null);

    void (async () => {
      const resultado = await obtenerPropiedad(id, controlador.signal);
      if (!resultado.ok) {
        setError(resultado.error.message);
        setCargando(false);
        return;
      }
      setPropiedad(resultado.data);
      setCargando(false);
    })();

    return () => controlador.abort();
  }, [id]);

  if (!id) return null;

  if (cargando) {
    return (
      <section>
        <p className="texto-muted">Cargando propiedad…</p>
      </section>
    );
  }

  if (error || !propiedad) {
    return (
      <section>
        <p className="campo-error" role="alert">
          {error ?? "No se pudo cargar la propiedad."}
        </p>
        <Link to="/propiedades">Volver al listado</Link>
      </section>
    );
  }

  return (
    <section>
      <h2>
        Editar propiedad <span className="texto-muted">({propiedad.codigo})</span>
      </h2>

      <EstadoPropiedadControl propiedad={propiedad} onCambiado={setPropiedad} />

      <PropiedadForm modo="editar" propiedad={propiedad} onGuardado={setPropiedad} />

      <UbicacionField
        propiedadId={propiedad.id}
        latitud={propiedad.latitud}
        longitud={propiedad.longitud}
        onActualizado={(ubicacion) => setPropiedad((actual) => (actual ? { ...actual, ...ubicacion } : actual))}
      />

      <FotosField
        propiedadId={propiedad.id}
        fotos={propiedad.fotos}
        onActualizado={(fotos) => setPropiedad((actual) => (actual ? { ...actual, fotos } : actual))}
      />

      <HistorialEstadoLista propiedadId={propiedad.id} />

      <p>
        <Link to="/propiedades">Volver al listado</Link>
      </p>
    </section>
  );
}
