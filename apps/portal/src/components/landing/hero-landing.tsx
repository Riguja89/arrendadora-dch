import Image from "next/image";
import Link from "next/link";

/**
 * Hero de la landing institucional (HU-L01 escenario 2). Propuesta de valor,
 * logo, y dos CTAs: "Ver propiedades" (→ catálogo `/`) y "Contáctanos" (ancla a
 * la sección de contacto). Fondo con degradado del tema bronce/crema como
 * placeholder profesional.
 *
 * TODO(cliente): reemplazar el degradado de fondo por una foto real de Casanare
 * o de una propiedad emblemática (con overlay para preservar el contraste del
 * texto). El `min-height` evita CLS al sustituir el fondo.
 */
export function HeroLanding() {
  return (
    <section className="hero-landing">
      <div className="hero-landing__overlay" aria-hidden="true" />
      <div className="hero-landing__contenido">
        <Image
          src="/logo-simple-dch.svg"
          alt=""
          width={96}
          height={96}
          priority
          className="hero-landing__logo"
        />
        <h1 className="hero-landing__titulo">
          Tu aliado inmobiliario en <span className="hero-landing__acento">Casanare</span>
        </h1>
        <p className="hero-landing__subtitulo">
          Compra, vende o arrienda con la confianza de un equipo profesional en Yopal y Aguazul.
        </p>
        <div className="hero-landing__acciones">
          <Link href="/" className="boton-landing boton-landing--primario">
            Ver propiedades
          </Link>
          <a href="#contacto" className="boton-landing boton-landing--secundario">
            Contáctanos
          </a>
        </div>
      </div>
    </section>
  );
}
