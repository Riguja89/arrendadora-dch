import { useState, type FormEvent } from "react";
import { establecerUbicacion } from "@/lib/propiedades-api";
import { construirUrlEmbedMapaAdmin, estaMapaConfigurado, parsearLatitud, parsearLongitud } from "@/lib/maps";
import type { UbicacionRespuesta } from "@/lib/propiedades-types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface UbicacionFieldProps {
  propiedadId: string;
  latitud: number | null;
  longitud: number | null;
  onActualizado: (ubicacion: UbicacionRespuesta) => void;
}

/**
 * Ubicación aproximada de la propiedad (ADR-011): fijar coordenadas por geocodificación de la
 * dirección (delegada al backend) o manualmente. Solo disponible en edición — el endpoint
 * `PUT .../ubicacion` exige una propiedad ya creada. La dirección exacta nunca se expone al
 * portal público (solo ciudad/barrio); esta vista previa es una ayuda para quien la fija.
 *
 * Degradación: sin `VITE_GOOGLE_MAPS_API_KEY`, la vista previa cae a un mensaje de texto — los
 * inputs de latitud/longitud manuales siguen funcionando igual (ADR-011).
 */
export function UbicacionField({ propiedadId, latitud, longitud, onActualizado }: UbicacionFieldProps) {
  const [lat, setLat] = useState(latitud !== null ? String(latitud) : "");
  const [lng, setLng] = useState(longitud !== null ? String(longitud) : "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coordenadasActuales = latitud !== null && longitud !== null ? { latitud, longitud } : null;
  const urlEmbed = construirUrlEmbedMapaAdmin(coordenadasActuales, GOOGLE_MAPS_API_KEY);

  function aplicarRespuesta(respuesta: UbicacionRespuesta): void {
    setLat(respuesta.latitud !== null ? String(respuesta.latitud) : "");
    setLng(respuesta.longitud !== null ? String(respuesta.longitud) : "");
    onActualizado(respuesta);
  }

  async function manejarGeocodificar(): Promise<void> {
    setError(null);
    setEnviando(true);
    const resultado = await establecerUbicacion(propiedadId, { geocodificar_direccion: true });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error.message);
      return;
    }
    aplicarRespuesta(resultado.data);
  }

  async function manejarGuardarManual(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);

    const latNum = parsearLatitud(lat);
    const lngNum = parsearLongitud(lng);
    if (lat.trim() !== "" && latNum === null) {
      setError("La latitud debe ser un número entre -90 y 90.");
      return;
    }
    if (lng.trim() !== "" && lngNum === null) {
      setError("La longitud debe ser un número entre -180 y 180.");
      return;
    }

    setEnviando(true);
    const resultado = await establecerUbicacion(propiedadId, { latitud: latNum, longitud: lngNum });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error.message);
      return;
    }
    aplicarRespuesta(resultado.data);
  }

  return (
    <fieldset className="ubicacion-field">
      <legend>Ubicación</legend>
      <p className="texto-muted">
        La dirección exacta nunca se muestra en el portal público — solo la ciudad y el barrio (ADR-011).
      </p>
      <button type="button" disabled={enviando} onClick={() => void manejarGeocodificar()}>
        Calcular desde la dirección de la propiedad
      </button>
      <form className="ubicacion-field__manual" onSubmit={manejarGuardarManual}>
        <div className="campo">
          <label htmlFor="ubicacion-lat">Latitud</label>
          <input
            id="ubicacion-lat"
            inputMode="decimal"
            value={lat}
            placeholder="Ej. 5.3378"
            disabled={enviando}
            onChange={(evento) => setLat(evento.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="ubicacion-lng">Longitud</label>
          <input
            id="ubicacion-lng"
            inputMode="decimal"
            value={lng}
            placeholder="Ej. -72.3959"
            disabled={enviando}
            onChange={(evento) => setLng(evento.target.value)}
          />
        </div>
        <button type="submit" disabled={enviando}>
          Guardar ubicación
        </button>
      </form>
      {urlEmbed ? (
        <iframe
          title="Vista previa de ubicación"
          src={urlEmbed}
          width="100%"
          height="240"
          style={{ border: 0 }}
          loading="lazy"
        />
      ) : (
        <p className="texto-muted">
          {estaMapaConfigurado(GOOGLE_MAPS_API_KEY)
            ? "Vista previa de mapa no disponible todavía — fijá coordenadas primero."
            : "Vista previa de mapa no disponible: falta configurar VITE_GOOGLE_MAPS_API_KEY."}
        </p>
      )}
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
