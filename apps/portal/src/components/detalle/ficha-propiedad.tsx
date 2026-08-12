import Link from "next/link";
import type { PropiedadDetalle, TipoOperacion } from "@arrendadora/shared";
import { formatearPrecioCOP } from "@/lib/format";
import { GaleriaPropiedad } from "./galeria-propiedad";
import { MapaUbicacion } from "./mapa-ubicacion";
import { ContactoWhatsapp } from "./contacto-whatsapp";

const ETIQUETA_OPERACION: Record<TipoOperacion, string> = {
  arriendo: "Arriendo",
  venta: "Venta",
};

interface FichaPropiedadProps {
  propiedad: PropiedadDetalle;
}

/**
 * Contenido visual de la ficha de detalle (CU-002, spec-portal-detalle) — galería, precio
 * (RN-001), características, mapa aproximado (ADR-011) y contacto por WhatsApp (ADR-007,
 * ADR-012). Server Component puro (sin fetch propio): la resolución de datos y el 404 (RN-025)
 * quedan a cargo del caller (`app/propiedades/[operacion]/[segmento]/page.tsx`, ADR-018), que es
 * el único punto de la ruta que sabe si el segmento es una ficha o un catálogo de ciudad.
 */
export function FichaPropiedad({ propiedad }: FichaPropiedadProps) {
  return (
    <main className="container ficha-propiedad">
      <Link href="/" className="ficha-propiedad__volver">
        ← Volver a propiedades
      </Link>

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
