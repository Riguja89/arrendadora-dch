/**
 * Design tokens base — espejo tipado de `tokens.css` (ADR-002: portal y admin comparten
 * tokens). Útil para lógica que necesita el valor en JS/TS (ej. breakpoints en `matchMedia`,
 * theming programático). Para estilos, preferir las CSS custom properties de `tokens.css`
 * (`@arrendadora/design-tokens/css`).
 *
 * Mantener sincronizado manualmente con `tokens.css` — ambos archivos expresan los mismos
 * valores en dos formatos de consumo. Si el proyecto crece, evaluar generar `tokens.css` a
 * partir de este archivo (o viceversa) con un script de build dedicado.
 */

export const color = {
  primary: "#1d4ed8",
  primaryHover: "#1e40af",
  primaryContrast: "#ffffff",
  success: "#15803d",
  error: "#b91c1c",
  warning: "#b45309",
  text: "#111827",
  textMuted: "#4b5563",
  background: "#ffffff",
  surface: "#f9fafb",
  border: "#e5e7eb",
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const lineHeight = {
  tight: 1.25,
  base: 1.5,
} as const;

export const fontFamilyBase =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Escala de espaciado en rem, base 4px — mobile-first. */
export const space = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const radius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(17, 24, 39, 0.06)",
  md: "0 4px 12px rgba(17, 24, 39, 0.1)",
} as const;

/** Breakpoints de referencia (mobile-first), en píxeles. */
export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
