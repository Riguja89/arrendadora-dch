"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiltrosCatalogoForm } from "./filtros-catalogo-form";
import { BotonFiltroFlotante } from "./boton-filtro-flotante";
import { FiltrosMobileDrawer } from "./filtros-mobile-drawer";
import {
  contarFiltrosActivos,
  valoresInicialesAEstado,
  type ValoresInicialesFiltros,
} from "@/lib/catalogo-filtros";

interface OpcionTipoPropiedad {
  id: string;
  nombre: string;
}

interface OpcionCiudad {
  ciudad: string;
  total: number;
}

interface FiltrosCatalogoStickyProps {
  tiposPropiedad: OpcionTipoPropiedad[];
  ciudades: OpcionCiudad[];
  valoresIniciales: ValoresInicialesFiltros;
}

/**
 * Wrapper responsive (BUILD-040 §8.1.1).
 *
 * Desktop (≥1024px, media query CSS):
 *   Renderiza un sentinel de 1px inmediatamente antes de la barra + observa
 *   con IntersectionObserver: cuando el sentinel sale del viewport la barra
 *   entra en modo "compact". La transición de background/box-shadow/padding
 *   la hace CSS puro (§1.3). Sticky position lo aplica el CSS.
 *
 * Mobile/Tablet (<1024px, media query CSS):
 *   La barra inline queda oculta con `display: none`. En su lugar se
 *   monta el FAB + el `FiltrosMobileDrawer` (Bottom Sheet vía portal).
 *
 * Fallback: si `IntersectionObserver` no existe, la barra queda en modo
 * natural con `position: sticky` sin cambio a compacta — degradación aceptable
 * (§1.3).
 */
export function FiltrosCatalogoSticky({
  tiposPropiedad,
  ciudades,
  valoresIniciales,
}: FiltrosCatalogoStickyProps) {
  const [compacta, setCompacta] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const idAuto = useId();
  const sheetId = `bottom-sheet-filtros-${idAuto}`;

  // Conteo del badge del FAB — refleja los filtros ya APLICADOS (URL).
  const conteoAplicados = useMemo(
    () => contarFiltrosActivos(valoresInicialesAEstado(valoresIniciales)),
    [valoresIniciales],
  );

  // IntersectionObserver del sentinel → toggle de la clase `--compacta`.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        const [entry] = entradas;
        if (entry) setCompacta(!entry.isIntersecting);
      },
      // rootMargin negativo en top: dispara el toggle un poco antes de que
      // el sentinel toque exactamente el borde superior, evita jitter.
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ─────── Desktop (≥1024px) ─────── */}
      <div className="filtros-catalogo-desktop">
        <div
          ref={sentinelRef}
          className="filtros-catalogo-desktop__sentinel"
          aria-hidden="true"
        />
        <div
          className={
            compacta
              ? "filtros-catalogo-desktop__wrapper filtros-catalogo-desktop__wrapper--sticky"
              : "filtros-catalogo-desktop__wrapper"
          }
          data-state={compacta ? "compact" : "natural"}
        >
          <div className="filtros-catalogo-desktop__inner">
            <FiltrosCatalogoForm
              tiposPropiedad={tiposPropiedad}
              ciudades={ciudades}
              valoresIniciales={valoresIniciales}
              variant={compacta ? "compact" : "natural"}
            />
          </div>
        </div>
      </div>

      {/* ─────── Mobile / Tablet (<1024px) ─────── */}
      <div className="filtros-catalogo-mobile">
        <BotonFiltroFlotante
          conteoFiltrosActivos={conteoAplicados}
          abierto={drawerAbierto}
          ariaControls={sheetId}
          onClick={() => setDrawerAbierto((abierto) => !abierto)}
        />
        <FiltrosMobileDrawer
          tiposPropiedad={tiposPropiedad}
          ciudades={ciudades}
          valoresIniciales={valoresIniciales}
          open={drawerAbierto}
          onOpenChange={setDrawerAbierto}
          sheetId={sheetId}
        />
      </div>
    </>
  );
}
