import Link from "next/link";
import type { PropiedadResumen } from "@arrendadora/shared";
import { PropiedadCard } from "@/components/catalogo/propiedad-card";
import { IconoFlecha } from "./iconos";

interface DestacadasLandingProps {
  propiedades: PropiedadResumen[];
}

/**
 * Sección "Propiedades destacadas" (HU-L05, RN-L05). Reutiliza `PropiedadCard`
 * del catálogo y la lógica de `listarDestacadas()` (máx 6, resuelta en el server
 * component de la página). Estado vacío con mensaje de cortesía (HU-L05
 * escenario 2). Enlace "Ver todas las propiedades" → catálogo.
 */
export function DestacadasLanding({ propiedades }: DestacadasLandingProps) {
  const visibles = propiedades.slice(0, 6);

  return (
    <section className="seccion seccion--elevada" aria-labelledby="destacadas-landing-titulo">
      <div className="contenedor-landing">
        <h2 id="destacadas-landing-titulo" className="seccion__titulo seccion__titulo--centrado">
          Propiedades destacadas
        </h2>

        {visibles.length > 0 ? (
          <>
            <ul className="propiedad-grid">
              {visibles.map((propiedad) => (
                <PropiedadCard key={propiedad.codigo} propiedad={propiedad} />
              ))}
            </ul>
            <div className="destacadas-landing__pie">
              <Link href="/" className="enlace-flecha">
                Ver todas las propiedades
                <IconoFlecha />
              </Link>
            </div>
          </>
        ) : (
          <p className="mensaje-cortesia mensaje-cortesia--centrado">
            Próximamente nuevas propiedades. Contáctanos para conocer disponibilidad.
          </p>
        )}
      </div>
    </section>
  );
}
