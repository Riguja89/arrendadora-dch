import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "@arrendadora/design-tokens/css";
import "@arrendadora/design-tokens/portal-theme";
import "./globals.css";

/**
 * Tipografía oficial del portal (BUILD-039). `next/font/google` autohospeda las
 * fuentes con `font-display: swap` y evita FOUT / capas externas de Google Fonts
 * durante el build. Las CSS custom properties `--font-display` y `--font-body`
 * usan el nombre real de la familia (definido en `portal-theme.css`); estas
 * variables `.variable` sirven como CDN de FontFace + precarga.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-source-sans-3",
});

export const metadata: Metadata = {
  title: {
    default: "Arrendadora — Arriendo y venta de inmuebles en Yopal y Aguazul",
    template: "%s | Arrendadora",
  },
  description:
    "Portal de propiedades en arriendo y venta en Yopal y Aguazul (Casanare).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${sourceSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
