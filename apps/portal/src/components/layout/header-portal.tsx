"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MARCA } from "@/lib/contacto-config";

interface EnlaceNav {
  href: string;
  etiqueta: string;
}

const ENLACES: readonly EnlaceNav[] = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/nosotros", etiqueta: "Nosotros" },
];

/**
 * Header global del portal (HU-L04, RN-L07). Compartido entre el catálogo (`/`)
 * y la landing (`/nosotros`) montándose en `app/layout.tsx`. Sticky, con logo que
 * enlaza a la página Nosotros, navegación con indicador de página activa y menú
 * hamburguesa en mobile.
 *
 * Client Component: `usePathname` resuelve el enlace activo y `useState` controla
 * la apertura del menú mobile.
 */
export function HeaderPortal() {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function esActivo(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="header-portal">
      <div className="header-portal__inner">
        <Link href="/nosotros" className="header-portal__marca" aria-label={`${MARCA.nombre} — ir a Nosotros`}>
          <Image
            src="/logo-simple-dch.svg"
            alt=""
            width={44}
            height={44}
            priority
            className="header-portal__logo"
          />
          <span className="header-portal__nombre">{MARCA.nombre}</span>
        </Link>

        <nav className="header-portal__nav" aria-label="Navegación principal">
          <ul className="header-portal__lista">
            {ENLACES.map((enlace) => {
              const activo = esActivo(enlace.href);
              return (
                <li key={enlace.href}>
                  <Link
                    href={enlace.href}
                    className={`header-portal__enlace${activo ? " header-portal__enlace--activo" : ""}`}
                    aria-current={activo ? "page" : undefined}
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="header-portal__hamburguesa"
          aria-expanded={menuAbierto}
          aria-controls="header-menu-mobile"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {menuAbierto ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuAbierto ? (
        <nav
          id="header-menu-mobile"
          className="header-portal__menu-mobile"
          aria-label="Navegación principal (mobile)"
        >
          <ul>
            {ENLACES.map((enlace) => {
              const activo = esActivo(enlace.href);
              return (
                <li key={enlace.href}>
                  <Link
                    href={enlace.href}
                    className={`header-portal__enlace-mobile${activo ? " header-portal__enlace-mobile--activo" : ""}`}
                    aria-current={activo ? "page" : undefined}
                    onClick={() => setMenuAbierto(false)}
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
