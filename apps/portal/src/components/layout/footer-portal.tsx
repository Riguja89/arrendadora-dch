import Image from "next/image";
import Link from "next/link";
import {
  construirEnlaceFacebook,
  construirEnlaceInstagram,
  MARCA,
} from "@/lib/contacto-config";
import { IconoInstagram, IconoFacebook } from "@/components/landing/iconos";

/**
 * Footer global del portal (wireframe §3.9). Compartido entre catálogo y landing
 * vía `app/layout.tsx`. Logo, descriptor, enlaces de navegación, redes sociales y
 * copyright. Server Component: contenido estático (RN-L01).
 */
export function FooterPortal() {
  const anio = new Date().getFullYear();

  return (
    <footer className="footer-portal">
      <div className="footer-portal__inner">
        <div className="footer-portal__marca">
          <Image
            src="/logo-simple-dch.svg"
            alt=""
            width={40}
            height={40}
            className="footer-portal__logo"
          />
          <div>
            <p className="footer-portal__nombre">{MARCA.nombre}</p>
            <p className="footer-portal__descriptor">{MARCA.descriptor}, Casanare.</p>
          </div>
        </div>

        <nav className="footer-portal__nav" aria-label="Enlaces del pie de página">
          <Link href="/" className="footer-portal__enlace">
            Inicio
          </Link>
          <Link href="/nosotros" className="footer-portal__enlace">
            Nosotros
          </Link>
          <a
            href={construirEnlaceInstagram()}
            className="footer-portal__enlace"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de D-CH Inmobiliaria (abre en una pestaña nueva)"
          >
            <IconoInstagram />
            <span>Instagram</span>
          </a>
          <a
            href={construirEnlaceFacebook()}
            className="footer-portal__enlace"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook de D-CH Inmobiliaria (abre en una pestaña nueva)"
          >
            <IconoFacebook />
            <span>Facebook</span>
          </a>
        </nav>
      </div>

      <p className="footer-portal__copyright">
        © {anio} {MARCA.nombre}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
