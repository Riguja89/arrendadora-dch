"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Bottom sheet accesible (BUILD-040 §2.3 + §5).
 *
 * Contratos:
 *   - Portal a `document.body` (evita `overflow:hidden` en ancestros).
 *   - `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
 *   - Cierre por: X, tap overlay, Escape.
 *   - Focus trap manual con `focus`/`Tab` (sin dependencia externa) — cubre
 *     el 100% de los casos que necesita el drawer de filtros (5 selects + 2
 *     inputs + CTA + link limpiar), suficiente hasta v2.
 *   - Restauración del foco al elemento que abrió el sheet.
 *   - Lock del scroll del body (`overflow:hidden` + preserva la posición).
 *   - Animación slide-up controlada por `[data-state]`; respeta
 *     `prefers-reduced-motion` (el token global en `portal-theme.css` colapsa
 *     todas las transiciones a 0.01ms).
 *
 * NO implementa drag-to-dismiss (postergado a v2 — el spec §8.2 lo permite).
 */

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  labelledById?: string;
  /** ID del contenedor del sheet — usarse desde el trigger como `aria-controls`. */
  id?: string;
  /** Texto del `aria-label` del botón X (default: "Cerrar"). */
  cerrarLabel?: string;
  children: ReactNode;
}

/** Selectores focusables — cubre inputs, botones, links y elementos con tabindex explícito ≥ 0. */
const SELECTOR_FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function esFocusable(elemento: Element): elemento is HTMLElement {
  if (!(elemento instanceof HTMLElement)) return false;
  if (elemento.hasAttribute("disabled")) return false;
  if (elemento.getAttribute("aria-hidden") === "true") return false;
  return true;
}

export function BottomSheet({
  open,
  onOpenChange,
  titulo,
  labelledById,
  id,
  cerrarLabel = "Cerrar",
  children,
}: BottomSheetProps) {
  const [montado, setMontado] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const foco_previo_ref = useRef<HTMLElement | null>(null);
  const idAuto = useId();
  const tituloId = labelledById ?? `bottom-sheet-titulo-${idAuto}`;
  const sheetId = id ?? `bottom-sheet-${idAuto}`;

  // Solo montamos el portal en el cliente (App Router puede ser SSR).
  useEffect(() => {
    setMontado(true);
  }, []);

  const cerrar = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Lock del scroll del body + guardar foco previo cuando abre.
  useLayoutEffect(() => {
    if (!open) return;

    // Recordar quién tenía el foco para restaurarlo al cerrar.
    foco_previo_ref.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    if (typeof document !== "undefined") {
      const overflow_previo = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow_previo;
      };
    }
    return undefined;
  }, [open]);

  // Restaurar el foco al elemento que abrió el sheet (post-cierre).
  useEffect(() => {
    if (open) return;
    const previo = foco_previo_ref.current;
    if (previo && typeof previo.focus === "function") {
      // Diferimos un tick para que el trigger haya vuelto a estar en DOM/enabled.
      const raf = requestAnimationFrame(() => previo.focus());
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [open]);

  // Escape cierra + focus trap.
  useEffect(() => {
    if (!open) return;
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    // Auto-focus del primer campo focusable tras la animación de apertura.
    const raf = requestAnimationFrame(() => {
      const primero = contenedor.querySelector(SELECTOR_FOCUSABLE);
      if (primero && esFocusable(primero)) primero.focus();
    });

    function manejarTeclas(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        cerrar();
        return;
      }
      if (event.key !== "Tab") return;
      if (!contenedor) return;

      const focusables = Array.from(
        contenedor.querySelectorAll(SELECTOR_FOCUSABLE),
      ).filter(esFocusable);
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      const activo = document.activeElement;

      if (event.shiftKey && activo === primero) {
        event.preventDefault();
        ultimo?.focus();
      } else if (!event.shiftKey && activo === ultimo) {
        event.preventDefault();
        primero?.focus();
      }
    }

    document.addEventListener("keydown", manejarTeclas);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", manejarTeclas);
    };
  }, [open, cerrar]);

  if (!montado) return null;

  return createPortal(
    <div
      className="bottom-sheet-root"
      data-state={open ? "open" : "closed"}
      // aria-hidden en cerrado para que el árbol se ignore por SR sin desmontar
      // (mantiene la animación de cierre).
      aria-hidden={open ? undefined : "true"}
    >
      <div
        className="bottom-sheet__overlay"
        aria-hidden="true"
        onClick={cerrar}
      />
      <div
        ref={contenedorRef}
        className="bottom-sheet__panel"
        role="dialog"
        id={sheetId}
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="bottom-sheet__drag-handle" aria-hidden="true" />
        <div className="bottom-sheet__header">
          <h2 id={tituloId} className="bottom-sheet__titulo">
            {titulo}
          </h2>
          <button
            type="button"
            className="bottom-sheet__cerrar"
            onClick={cerrar}
            aria-label={cerrarLabel}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="bottom-sheet__contenido">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
