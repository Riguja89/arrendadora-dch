"use client";

import { useState, type KeyboardEvent, type TouchEvent } from "react";
import type { PropiedadDetalle } from "@arrendadora/shared";

const IMAGEN_GENERICA = "/placeholder-propiedad.svg";

/** Distancia mínima (px) de deslizamiento horizontal para interpretarlo como swipe. */
const UMBRAL_SWIPE_PX = 40;

interface GaleriaPropiedadProps {
  fotos: PropiedadDetalle["galeria"];
  tituloPropiedad: string;
}

/**
 * Galería de fotos con navegación anterior/siguiente, indicadores y swipe en móvil (HU-001
 * escenario 1). La foto de portada ya llega primero (`ordenarGaleriaConPortadaPrimero`,
 * `src/lib/api/detalle.ts`). Sin fotos → imagen de reemplazo genérica, sin controles (escenario 2).
 * Client Component: es la única pieza interactiva de la ficha que necesita estado local.
 */
export function GaleriaPropiedad({ fotos, tituloPropiedad }: GaleriaPropiedadProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [erroresCarga, setErroresCarga] = useState<Set<number>>(new Set());
  const [inicioToqueX, setInicioToqueX] = useState<number | null>(null);

  if (fotos.length === 0) {
    return (
      <div className="galeria-propiedad galeria-propiedad--sin-fotos">
        <img
          src={IMAGEN_GENERICA}
          alt={`Imagen genérica de ${tituloPropiedad} — sin fotos cargadas`}
          className="galeria-propiedad__imagen"
        />
      </div>
    );
  }

  const total = fotos.length;
  const foto = fotos[indiceActual];
  const urlActual = erroresCarga.has(indiceActual) || !foto ? IMAGEN_GENERICA : foto.urlOptimizada;

  function irA(indice: number) {
    setIndiceActual(((indice % total) + total) % total);
  }

  function anterior() {
    irA(indiceActual - 1);
  }

  function siguiente() {
    irA(indiceActual + 1);
  }

  function manejarTecla(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      anterior();
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      siguiente();
    }
  }

  function manejarInicioToque(evento: TouchEvent<HTMLDivElement>) {
    setInicioToqueX(evento.touches[0]?.clientX ?? null);
  }

  function manejarFinToque(evento: TouchEvent<HTMLDivElement>) {
    if (inicioToqueX === null) return;
    const finX = evento.changedTouches[0]?.clientX ?? inicioToqueX;
    const delta = finX - inicioToqueX;
    if (Math.abs(delta) >= UMBRAL_SWIPE_PX) {
      if (delta > 0) anterior();
      else siguiente();
    }
    setInicioToqueX(null);
  }

  return (
    <div
      className="galeria-propiedad"
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Galería de fotos de ${tituloPropiedad}`}
      tabIndex={0}
      onKeyDown={manejarTecla}
      onTouchStart={manejarInicioToque}
      onTouchEnd={manejarFinToque}
    >
      <div className="galeria-propiedad__visor">
        <img
          key={indiceActual}
          src={urlActual}
          alt={`Foto ${indiceActual + 1} de ${total} — ${tituloPropiedad}`}
          className="galeria-propiedad__imagen"
          onError={() => setErroresCarga((previo) => new Set(previo).add(indiceActual))}
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              className="galeria-propiedad__control galeria-propiedad__control--anterior"
              onClick={anterior}
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="galeria-propiedad__control galeria-propiedad__control--siguiente"
              onClick={siguiente}
              aria-label="Foto siguiente"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <p className="galeria-propiedad__contador" aria-live="polite">
        Foto {indiceActual + 1} de {total}
      </p>

      {total > 1 ? (
        <div className="galeria-propiedad__indicadores" role="tablist" aria-label="Seleccionar foto">
          {fotos.map((f, indice) => (
            <button
              key={`${f.urlThumbnail}-${indice}`}
              type="button"
              role="tab"
              aria-selected={indice === indiceActual}
              aria-label={`Ver foto ${indice + 1}`}
              className={
                indice === indiceActual
                  ? "galeria-propiedad__indicador galeria-propiedad__indicador--activo"
                  : "galeria-propiedad__indicador"
              }
              onClick={() => irA(indice)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
