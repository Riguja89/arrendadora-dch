import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@arrendadora/design-tokens/css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Arrendadora — Arriendo y venta de inmuebles en Yopal y Aguazul",
    template: "%s | Arrendadora",
  },
  description: "Portal de propiedades en arriendo y venta en Yopal y Aguazul (Casanare).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
