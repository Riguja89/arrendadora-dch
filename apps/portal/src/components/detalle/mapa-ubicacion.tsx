import type { PropiedadDetalle } from "@arrendadora/shared";
import { construirUrlEmbedMapa } from "@/lib/maps";

interface MapaUbicacionProps {
  ubicacion: PropiedadDetalle["ubicacion"];
  ciudad: string;
  barrio: string;
}

/**
 * Mapa aproximado de la zona (ADR-011 — nunca la dirección exacta). Server Component: el iframe
 * de Google Maps Embed no requiere JS del cliente para el pan/zoom nativo (HU-001 escenario 3).
 *
 * Degradación (HU-001 escenario 4, flujo de excepción 2b): sin API key configurada
 * (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) o sin coordenadas en la propiedad, se muestra la
 * ubicación textual (ciudad/barrio) en vez de romper la ficha.
 */
export function MapaUbicacion({ ubicacion, ciudad, barrio }: MapaUbicacionProps) {
  const urlEmbed = construirUrlEmbedMapa(ubicacion, process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  if (!urlEmbed) {
    return (
      <div className="mapa-ubicacion mapa-ubicacion--degradado" role="status">
        <p className="mapa-ubicacion__texto">
          Ubicación aproximada: {barrio}, {ciudad}.
        </p>
        <p className="mapa-ubicacion__nota">
          El mapa interactivo no está disponible en este momento. Contactanos para conocer la
          ubicación exacta.
        </p>
      </div>
    );
  }

  return (
    <div className="mapa-ubicacion">
      <iframe
        className="mapa-ubicacion__iframe"
        title={`Ubicación aproximada — ${barrio}, ${ciudad}`}
        src={urlEmbed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <p className="mapa-ubicacion__nota">
        La ubicación es aproximada al sector ({barrio}). La dirección exacta se comparte al
        contactar al agente.
      </p>
    </div>
  );
}
