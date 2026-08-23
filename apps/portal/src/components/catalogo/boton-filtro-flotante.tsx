"use client";

import { forwardRef } from "react";
import { BadgeConteo } from "@/components/primitivos/badge-conteo";

/**
 * FAB de filtros (BUILD-040 §2.1 y §2.2). Circular 56×56, posición
 * `fixed bottom:24 right:16` (safe-area en iOS via env()), color cobre marca.
 *
 * `aria-label` cambia dinámicamente según el conteo:
 *   0    → "Abrir filtros de búsqueda"
 *   1    → "Abrir filtros de búsqueda, 1 filtro activo"
 *   N>1  → "Abrir filtros de búsqueda, N filtros activos"
 *
 * Marca `aria-haspopup="dialog"` + `aria-expanded` + `aria-controls` para que
 * los lectores de pantalla anuncien correctamente el widget de disclosure.
 */
interface BotonFiltroFlotanteProps {
  conteoFiltrosActivos: number;
  abierto: boolean;
  ariaControls: string;
  onClick: () => void;
}

function formatearAriaLabel(conteo: number): string {
  if (conteo <= 0) return "Abrir filtros de búsqueda";
  const sustantivo = conteo === 1 ? "filtro activo" : "filtros activos";
  return `Abrir filtros de búsqueda, ${conteo} ${sustantivo}`;
}

export const BotonFiltroFlotante = forwardRef<
  HTMLButtonElement,
  BotonFiltroFlotanteProps
>(function BotonFiltroFlotante(
  { conteoFiltrosActivos, abierto, ariaControls, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="boton-filtro-flotante"
      aria-label={formatearAriaLabel(conteoFiltrosActivos)}
      aria-haspopup="dialog"
      aria-expanded={abierto}
      aria-controls={ariaControls}
      onClick={onClick}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={24}
        height={24}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Embudo — coherente con /public/icon-filtros-dch.svg, inline para heredar
            color=currentColor sobre el fondo cobre del FAB (texto inverso blanco). */}
        <path d="M4 5 L20 5 L14 12 L14 20 L10 18 L10 12 Z" />
        <line x1="8" y1="8" x2="16" y2="8" opacity="0.6" />
      </svg>
      <BadgeConteo count={conteoFiltrosActivos} />
    </button>
  );
});
