import { DIFERENCIALES } from "@/lib/contacto-config";
import { IconoCheck } from "./iconos";

/**
 * Sección "Por qué elegirnos" (wireframe §3.5). Grid 2x2 de diferenciales, cada
 * uno con check verde salvia, título y descripción. 1 columna en mobile.
 */
export function Diferenciales() {
  return (
    <section className="seccion seccion--pagina" aria-labelledby="diferenciales-titulo">
      <div className="contenedor-landing">
        <h2 id="diferenciales-titulo" className="seccion__titulo seccion__titulo--centrado">
          Por qué elegirnos
        </h2>
        <ul className="diferenciales-grid">
          {DIFERENCIALES.map((diferencial) => (
            <li key={diferencial.id} className="diferencial">
              <span className="diferencial__check" aria-hidden="true">
                <IconoCheck />
              </span>
              <div>
                <h3 className="diferencial__titulo">{diferencial.titulo}</h3>
                <p className="diferencial__descripcion">{diferencial.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
