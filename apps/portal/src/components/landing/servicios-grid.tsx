import type { ComponentType } from "react";
import { SERVICIOS } from "@/lib/contacto-config";
import {
  IconoArriendo,
  IconoAvaluos,
  IconoCompra,
  IconoVenta,
} from "./iconos";

/** Mapa id de servicio → componente de icono decorativo. */
const ICONOS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  compra: IconoCompra,
  venta: IconoVenta,
  arriendo: IconoArriendo,
  avaluos: IconoAvaluos,
};

/**
 * Sección "Nuestros servicios" (HU-L01 escenario 4). Grid de 4 cards con icono,
 * título y descripción breve. 4 columnas desktop, 2x2 tablet, 1 columna mobile.
 */
export function ServiciosGrid() {
  return (
    <section className="seccion seccion--elevada" aria-labelledby="servicios-titulo">
      <div className="contenedor-landing">
        <h2 id="servicios-titulo" className="seccion__titulo seccion__titulo--centrado">
          Nuestros servicios
        </h2>
        <ul className="servicios-grid">
          {SERVICIOS.map((servicio) => {
            const Icono = ICONOS[servicio.id];
            return (
              <li key={servicio.id} className="servicio-card">
                <div className="servicio-card__icono">{Icono ? <Icono /> : null}</div>
                <h3 className="servicio-card__titulo">{servicio.titulo}</h3>
                <p className="servicio-card__descripcion">{servicio.descripcion}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
