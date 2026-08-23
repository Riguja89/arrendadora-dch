import { useNavigate } from "react-router-dom";
import { PropiedadForm } from "@/components/propiedades/PropiedadForm";
import type { Propiedad } from "@/lib/propiedades-types";

/** CU-001 — creación de propiedad (HU-001). Al guardar, redirige al detalle/edición recién creada. */
export function PropiedadNuevaPage() {
  const navigate = useNavigate();

  function manejarGuardado(propiedad: Propiedad): void {
    navigate(`/propiedades/${propiedad.id}/editar`, { replace: true });
  }

  return (
    <section>
      <h2>Nueva propiedad</h2>
      <PropiedadForm modo="crear" onGuardado={manejarGuardado} />
    </section>
  );
}
