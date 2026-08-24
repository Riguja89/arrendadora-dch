/**
 * Iconografía SVG inline de la landing (BUILD-043). SVG propio en vez de emojis
 * o paquetes externos: tematizable con `currentColor`, accesible (`aria-hidden`)
 * y consistente con el sistema de diseño. Todos son decorativos — el label lo
 * aporta el texto o el `aria-label` del contenedor.
 */

interface IconoProps {
  /** Tamaño en px (width y height). Default 24. */
  size?: number;
  className?: string;
}

function baseProps(size: number, className?: string) {
  return {
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
}

/** Compra — casa con lupa. */
export function IconoCompra({ size = 28, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h6v-6h2v6" />
      <circle cx="16.5" cy="15.5" r="2.5" />
      <line x1="18.5" y1="17.5" x2="21" y2="20" />
    </svg>
  );
}

/** Venta — etiqueta de precio. */
export function IconoVenta({ size = 28, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </svg>
  );
}

/** Arriendo — llave. */
export function IconoArriendo({ size = 28, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="8" cy="8" r="4" />
      <path d="M10.8 10.8 20 20" />
      <path d="M16 16l2 2 2-2" />
    </svg>
  );
}

/** Avalúos — gráfico de barras. */
export function IconoAvaluos({ size = 28, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="5" y="12" width="3.5" height="6" />
      <rect x="10.5" y="8" width="3.5" height="10" />
      <rect x="16" y="4" width="3.5" height="14" />
    </svg>
  );
}

/** Check — diferenciales. */
export function IconoCheck({ size = 22, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

/** WhatsApp. */
export function IconoWhatsapp({ size = 24, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M4 20l1.4-4.2A7.5 7.5 0 1 1 8.2 18.6L4 20Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.5 0 1-.4 1-1v-.8l-1.7-.7-.8.8a4 4 0 0 1-1.8-1.8l.8-.8-.7-1.7H9.5c-.3 0-.5.2-.5.5Z" />
    </svg>
  );
}

/** Teléfono. */
export function IconoTelefono({ size = 24, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M4.5 5.5c0-.6.4-1 1-1h2.2c.5 0 .9.3 1 .8l.7 2.6c.1.4 0 .8-.3 1l-1.2 1a11 11 0 0 0 4.4 4.4l1-1.2c.2-.3.6-.4 1-.3l2.6.7c.5.1.8.5.8 1V18c0 .6-.4 1-1 1A13.5 13.5 0 0 1 4.5 5.5Z" />
    </svg>
  );
}

/** Email / sobre. */
export function IconoEmail({ size = 24, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

/** Ubicación / pin. */
export function IconoUbicacion({ size = 24, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

/** Instagram. */
export function IconoInstagram({ size = 22, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Facebook. */
export function IconoFacebook({ size = 22, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M14.5 8.5V6.8c0-.7.3-1.1 1.1-1.1h1.4V3h-2.3c-2 0-3.2 1.2-3.2 3.3v2.2H9v2.7h2.5V21h3v-9.8h2.2l.4-2.7h-2.6Z" />
    </svg>
  );
}

/** Flecha derecha — enlaces "ver más". */
export function IconoFlecha({ size = 18, className }: IconoProps) {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
