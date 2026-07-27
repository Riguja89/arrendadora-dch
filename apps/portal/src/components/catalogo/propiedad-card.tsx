import Link from "next/link";
import type { PropiedadResumen } from "@arrendadora/shared";
import { formatearPrecioCOP } from "@/lib/format";
import { PropiedadImagen } from "./propiedad-imagen";

const ETIQUETA_OPERACION: Record<PropiedadResumen["tipoOperacion"], string> = {
  arriendo: "Arriendo",
  venta: "Venta",
};

interface PropiedadCardProps {
  propiedad: PropiedadResumen;
}

/** Tarjeta de propiedad (HU-002) — foto, badge, precio COP (RN-001), ubicación y datos clave. */
export function PropiedadCard({ propiedad }: PropiedadCardProps) {
  return (
    <li className="propiedad-card">
      <Link
        href={`/propiedades/${propiedad.slug}`}
        className="propiedad-card__enlace"
        aria-label={`Ver detalle de ${propiedad.titulo}`}
      >
        <div className="propiedad-card__imagen-wrapper">
          <PropiedadImagen src={propiedad.portadaUrl} alt={`Foto de portada de ${propiedad.titulo}`} />
          <span className="propiedad-card__etiqueta-operacion">
            {ETIQUETA_OPERACION[propiedad.tipoOperacion]}
          </span>
          {propiedad.badgeReservada ? (
            <span className="propiedad-card__badge">Reservada</span>
          ) : null}
        </div>
        <div className="propiedad-card__contenido">
          <p className="propiedad-card__precio">{formatearPrecioCOP(propiedad.precio)}</p>
          <h3 className="propiedad-card__titulo">{propiedad.titulo}</h3>
          <p className="propiedad-card__ubicacion">
            {propiedad.tipoPropiedad} · {propiedad.ciudad}, {propiedad.barrio}
          </p>
          <p className="propiedad-card__datos">
            {propiedad.habitaciones} hab. · {propiedad.banos} baños · {propiedad.area} m²
          </p>
        </div>
      </Link>
    </li>
  );
}
