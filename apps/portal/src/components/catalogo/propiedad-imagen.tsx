"use client";

import { useState } from "react";

const IMAGEN_GENERICA = "/placeholder-propiedad.svg";

interface PropiedadImagenProps {
  src: string;
  alt: string;
}

/**
 * Imagen de portada de una tarjeta de propiedad. Client Component aislado (única pieza
 * interactiva de la tarjeta): si `src` viene vacío o la carga falla, cae a la imagen genérica
 * de la inmobiliaria sin interrumpir el listado (HU-002 escenario 2, flujo de excepción 1b).
 */
export function PropiedadImagen({ src, alt }: PropiedadImagenProps) {
  const [urlActual, setUrlActual] = useState(src && src.trim().length > 0 ? src : IMAGEN_GENERICA);

  return (
    <img
      src={urlActual}
      alt={alt}
      loading="lazy"
      onError={() => setUrlActual(IMAGEN_GENERICA)}
      className="propiedad-card__imagen"
    />
  );
}
