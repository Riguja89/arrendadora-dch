import type {
  OpenGraphPropiedad,
  PropiedadDetalle,
  RespuestaError,
  UbicacionAproximada,
} from "@arrendadora/shared";
import { peticionApi, peticionApiPost, type RespuestaApi } from "@/lib/http-client";

/**
 * Wire (snake_case) de la ficha de detalle y del contacto por WhatsApp — contrato DESIGN-029,
 * bounded context `portal-detalle`. Igual que `catalogo.ts`, se declara local a `apps/portal`:
 * no se acopla `@arrendadora/shared` a la forma exacta del wire (`detalle.mapper.ts` de
 * `apps/api` hace lo mismo del lado del backend).
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

export interface PropiedadDetalleWire {
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
  tipo_operacion: PropiedadDetalle["tipoOperacion"];
  tipo_propiedad: string;
  ciudad: string;
  barrio: string;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  estado: PropiedadDetalle["estado"];
  badge_reservada: boolean;
  amenidades: AmenidadWire[];
  galeria: FotoGaleriaWire[];
  ubicacion: UbicacionWire | null;
  open_graph: OpenGraphWire;
}

/** Respuesta de `POST /public/propiedades/{slug}/contacto-whatsapp` (contrato DESIGN-029). */
export interface ContactoWhatsappWire {
  deep_link: string;
}

export interface ContactoWhatsapp {
  deepLink: string;
}

/**
 * Garantiza que la foto de portada quede primero (HU-001 escenario 1). El contrato ya declara
 * la galería ordenada con la portada al inicio; se reordena de forma defensiva por si el backend
 * cambia esa garantía sin que el frontend se entere.
 */
function ordenarGaleriaConPortadaPrimero(
  galeria: PropiedadDetalle["galeria"],
): PropiedadDetalle["galeria"] {
  const portada = galeria.filter((foto) => foto.esPortada);
  const resto = galeria.filter((foto) => !foto.esPortada);
  return [...portada, ...resto];
}

function aUbicacion(wire: UbicacionWire | null): UbicacionAproximada | null {
  return wire ? { latitud: wire.latitud, longitud: wire.longitud } : null;
}

function aOpenGraph(wire: OpenGraphWire): OpenGraphPropiedad {
  return {
    titulo: wire.titulo,
    descripcion: wire.descripcion,
    imagen: wire.imagen,
    url: wire.url,
  };
}

/** Mapea `PropiedadDetalleWire` (snake_case) al modelo de dominio compartido (camelCase). */
export function aPropiedadDetalle(wire: PropiedadDetalleWire): PropiedadDetalle {
  return {
    codigo: wire.codigo,
    titulo: wire.titulo,
    slug: wire.slug,
    descripcion: wire.descripcion,
    tipoOperacion: wire.tipo_operacion,
    tipoPropiedad: wire.tipo_propiedad,
    ciudad: wire.ciudad,
    barrio: wire.barrio,
    precio: wire.precio,
    area: wire.area,
    habitaciones: wire.habitaciones,
    banos: wire.banos,
    estrato: wire.estrato,
    parqueaderos: wire.parqueaderos,
    estado: wire.estado,
    badgeReservada: wire.badge_reservada,
    amenidades: wire.amenidades.map((a) => ({ nombre: a.nombre, cantidad: a.cantidad })),
    galeria: ordenarGaleriaConPortadaPrimero(
      wire.galeria.map((foto) => ({
        urlOptimizada: foto.url_optimizada,
        urlCard: foto.url_card,
        urlThumbnail: foto.url_thumbnail,
        esPortada: foto.es_portada,
      })),
    ),
    ubicacion: aUbicacion(wire.ubicacion),
    openGraph: aOpenGraph(wire.open_graph),
  };
}

/** `GET /public/propiedades/{slug}` — CU-001 (ficha completa por slug, RN-025). */
export async function obtenerFichaPorSlug(slug: string): Promise<RespuestaApi<PropiedadDetalle>> {
  const respuesta = await peticionApi<PropiedadDetalleWire>(
    `/public/propiedades/${encodeURIComponent(slug)}`,
  );
  if (!respuesta.ok) return respuesta;
  return { ok: true, data: aPropiedadDetalle(respuesta.data) };
}

/**
 * `POST /public/propiedades/{slug}/contacto-whatsapp` — CU-002 (ADR-007 + ADR-012). El backend
 * valida el token de reCAPTCHA v3 server-side y devuelve el deep link `wa.me` ya armado con el
 * número central y la plantilla configurada; el frontend solo abre el enlace (RN-004, RN-022).
 */
export async function generarContactoWhatsapp(
  slug: string,
  recaptchaToken: string,
): Promise<RespuestaApi<ContactoWhatsapp>> {
  const respuesta = await peticionApiPost<ContactoWhatsappWire>(
    `/public/propiedades/${encodeURIComponent(slug)}/contacto-whatsapp`,
    { recaptcha_token: recaptchaToken },
  );
  if (!respuesta.ok) return respuesta;
  return { ok: true, data: { deepLink: respuesta.data.deep_link } };
}

/**
 * Traduce el envelope de error (ADR-015) del endpoint de contacto a un mensaje en español para
 * el visitante — RN-003 (anti-bot no disponible) y CU-002 flujo de excepción 3a (rechazo sin
 * detalles técnicos que ayuden a un bot).
 */
export function mensajeErrorContacto(error: RespuestaError): string {
  switch (error.error) {
    case "SERVICE_UNAVAILABLE":
      return "En este momento no podemos validar tu solicitud. Intenta de nuevo en unos minutos.";
    case "FORBIDDEN":
      return "No pudimos validar tu solicitud. Por favor intenta de nuevo.";
    case "NOT_FOUND":
      return "Esta propiedad ya no está disponible.";
    default:
      return "Ocurrió un error inesperado. Intenta de nuevo en unos minutos.";
  }
}
