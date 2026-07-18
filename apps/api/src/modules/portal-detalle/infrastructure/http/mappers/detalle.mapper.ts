import type { FotoPublica } from "../../../../admin-multimedia/domain/ports/multimedia-query.port";
import type { FichaDetalle } from "../../../application/use-cases/obtener-ficha-por-slug.use-case";
import { esBadgeReservada } from "../../../domain/rules/visibilidad-publica";

/**
 * Shapes del wire (snake_case) del contrato portal (DESIGN-029) para la ficha de detalle y el
 * contacto. Se declaran locales al módulo — mismo criterio que `portal-catalogo`/`admin-propiedades`—
 * para no acoplar `@arrendadora/shared` a este contrato ni requerir su rebuild.
 */

export interface AmenidadWire {
  nombre: string;
  cantidad: number;
}

export interface FotoGaleriaWire {
  url_optimizada: string;
  url_card: string;
  url_thumbnail: string;
  es_portada: boolean;
}

export interface UbicacionWire {
  latitud: number;
  longitud: number;
}

export interface OpenGraphWire {
  titulo: string;
  descripcion: string;
  imagen: string;
  url: string;
}

/** `PropiedadDetalle` del contrato — ficha completa (sin dirección cruda, agente ni historial). */
export interface PropiedadDetalleWire {
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
  tipo_operacion: string;
  tipo_propiedad: string;
  ciudad: string;
  barrio: string;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  estado: string;
  badge_reservada: boolean;
  amenidades: AmenidadWire[];
  galeria: FotoGaleriaWire[];
  /** Coordenadas aproximadas de la zona (ADR-011); `null` si la propiedad no tiene ubicación fijada. */
  ubicacion: UbicacionWire | null;
  open_graph: OpenGraphWire;
}

/** Respuesta de `POST /public/propiedades/{slug}/contacto-whatsapp` (contrato DESIGN-029). */
export interface ContactoWhatsappWire {
  deep_link: string;
}

function aFotoGaleriaWire(foto: FotoPublica): FotoGaleriaWire {
  return {
    url_optimizada: foto.urlOptimizada,
    url_card: foto.urlCard,
    url_thumbnail: foto.urlThumbnail,
    es_portada: foto.esPortada,
  };
}

/** Mapea la ficha completa (read model + galería + insumos OG) al `PropiedadDetalle` del contrato. */
export function aPropiedadDetalleWire(ficha: FichaDetalle): PropiedadDetalleWire {
  const p = ficha.propiedad;
  return {
    codigo: p.codigo,
    titulo: p.titulo,
    slug: p.slug,
    descripcion: p.descripcion,
    tipo_operacion: p.tipoOperacion,
    tipo_propiedad: p.tipoPropiedadNombre,
    ciudad: p.ciudad,
    // El contrato declara `barrio` como string; el modelo lo permite nulo → se proyecta cadena vacía.
    barrio: p.barrio ?? "",
    precio: p.precio,
    area: p.area,
    habitaciones: p.habitaciones,
    banos: p.banos,
    estrato: p.estrato,
    parqueaderos: p.parqueaderos,
    estado: p.estado,
    badge_reservada: esBadgeReservada(p.estado),
    amenidades: p.amenidades.map((a) => ({ nombre: a.nombre, cantidad: a.cantidad })),
    galeria: ficha.galeria.map(aFotoGaleriaWire),
    // ADR-011: solo se expone la ubicación aproximada si hay ambas coordenadas; nunca la dirección.
    ubicacion:
      p.latitud !== null && p.longitud !== null
        ? { latitud: p.latitud, longitud: p.longitud }
        : null,
    open_graph: {
      titulo: p.titulo,
      descripcion: p.descripcion,
      imagen: ficha.imagenOpenGraph,
      url: ficha.urlPublica,
    },
  };
}
