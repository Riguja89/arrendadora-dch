import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { TipoOperacion } from "@arrendadora/shared";
import { obtenerFichaPorSlug } from "@/lib/api/detalle";
import { formatearPrecioCOP } from "@/lib/format";
import { GaleriaPropiedad } from "@/components/detalle/galeria-propiedad";
import { MapaUbicacion } from "@/components/detalle/mapa-ubicacion";
import { ContactoWhatsapp } from "@/components/detalle/contacto-whatsapp";

interface PaginaPropiedadProps {
  params: Promise<{ slug: string }>;
}

const ETIQUETA_OPERACION: Record<TipoOperacion, string> = {
  arriendo: "Arriendo",
  venta: "Venta",
};

/**
 * Memoiza el fetch de la ficha dentro del mismo request (`react.cache`) — `generateMetadata` y
 * el componente de página comparten la misma llamada a `GET /public/propiedades/{slug}` en vez
 * de duplicarla (el cliente HTTP no cachea entre requests, RN "no-store").
 */
const obtenerFicha = cache(async (slug: string) => obtenerFichaPorSlug(slug));

/** SEO + Open Graph por propiedad (RN-008, ADR-010) — preview real al compartir por WhatsApp/redes. */
export async function generateMetadata({ params }: PaginaPropiedadProps): Promise<Metadata> {
  const { slug } = await params;
  const respuesta = await obtenerFicha(slug);

  if (!respuesta.ok) {
    return { title: "Propiedad no encontrada" };
  }

  const { openGraph } = respuesta.data;
  return {
    title: openGraph.titulo,
    description: openGraph.descripcion,
    openGraph: {
      title: openGraph.titulo,
      description: openGraph.descripcion,
      images: [{ url: openGraph.imagen }],
      url: openGraph.url,
      type: "website",
    },
  };
}

/**
 * Ficha de detalle (spec-002, CU-001/CU-002) — SSR real: galería, precio (RN-001), características,
 * mapa aproximado (ADR-011) y contacto por WhatsApp con anti-bot (ADR-007, ADR-012). Propiedades
 * `arrendada_vendida` o archivadas, o un slug inexistente → 404 (RN-025), impuesto por el backend
 * y respetado acá vía `notFound()` de Next.
 */
export default async function PaginaPropiedad({ params }: PaginaPropiedadProps) {
  const { slug } = await params;
  const respuesta = await obtenerFicha(slug);

  if (!respuesta.ok) {
    if (respuesta.error.error === "NOT_FOUND") {
      notFound();
    }

    return (
      <main className="container">
        <div className="catalogo__error" role="alert">
          <p>{respuesta.error.message}</p>
        </div>
      </main>
    );
  }

  const propiedad = respuesta.data;

  return (
    <main className="container ficha-propiedad">
      {propiedad.badgeReservada ? (
        <div className="ficha-propiedad__banner-reservada" role="status">
          Esta propiedad está reservada. Aún podés contactar al agente para consultar
          disponibilidad futura.
        </div>
      ) : null}

      <GaleriaPropiedad fotos={propiedad.galeria} tituloPropiedad={propiedad.titulo} />

      <div className="ficha-propiedad__contenido">
        <header className="ficha-propiedad__header">
          <span className="ficha-propiedad__etiqueta-operacion">
            {ETIQUETA_OPERACION[propiedad.tipoOperacion]}
          </span>
          <h1>{propiedad.titulo}</h1>
          <p className="ficha-propiedad__ubicacion">
            {propiedad.tipoPropiedad} · {propiedad.ciudad}, {propiedad.barrio}
          </p>
          <p className="ficha-propiedad__precio">{formatearPrecioCOP(propiedad.precio)}</p>
        </header>

        <dl className="ficha-propiedad__caracteristicas">
          <div>
            <dt>Área</dt>
            <dd>{propiedad.area} m²</dd>
          </div>
          <div>
            <dt>Habitaciones</dt>
            <dd>{propiedad.habitaciones}</dd>
          </div>
          <div>
            <dt>Baños</dt>
            <dd>{propiedad.banos}</dd>
          </div>
          {propiedad.estrato !== null ? (
            <div>
              <dt>Estrato</dt>
              <dd>{propiedad.estrato}</dd>
            </div>
          ) : null}
          {propiedad.parqueaderos !== null ? (
            <div>
              <dt>Parqueaderos</dt>
              <dd>{propiedad.parqueaderos}</dd>
            </div>
          ) : null}
        </dl>

        <section aria-labelledby="descripcion-titulo">
          <h2 id="descripcion-titulo">Descripción</h2>
          <p className="ficha-propiedad__descripcion">{propiedad.descripcion}</p>
        </section>

        {propiedad.amenidades.length > 0 ? (
          <section aria-labelledby="amenidades-titulo">
            <h2 id="amenidades-titulo">Características adicionales</h2>
            <ul className="ficha-propiedad__amenidades">
              {propiedad.amenidades.map((amenidad) => (
                <li key={amenidad.nombre}>
                  {amenidad.nombre}
                  {amenidad.cantidad > 1 ? ` (${amenidad.cantidad})` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="ubicacion-titulo">
          <h2 id="ubicacion-titulo">Ubicación</h2>
          <MapaUbicacion
            ubicacion={propiedad.ubicacion}
            ciudad={propiedad.ciudad}
            barrio={propiedad.barrio}
          />
        </section>

        <section aria-labelledby="contacto-titulo" className="ficha-propiedad__contacto">
          <h2 id="contacto-titulo">¿Te interesa esta propiedad?</h2>
          <ContactoWhatsapp slug={propiedad.slug} />
        </section>
      </div>
    </main>
  );
}
