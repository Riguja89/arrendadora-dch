import type { EstadoVisiblePublico, PropiedadResumen, TipoOperacion } from "@arrendadora/shared";
import { peticionApi, type RespuestaApi } from "@/lib/http-client";

/**
 * Wire (snake_case) del bounded context `portal-catalogo` — contrato DESIGN-029. Se declara
 * local a `apps/portal`, igual que hace `apps/api` en su propio `catalogo.mapper.ts`: no se
 * acopla `@arrendadora/shared` a la forma exacta del wire, solo al modelo de dominio (camelCase)
 * que consumen los componentes.
 */

export interface PropiedadResumenWire {
  codigo: string;
  titulo: string;
  slug: string;
  tipo_operacion: TipoOperacion;
  tipo_propiedad: string;
  ciudad: string;
  barrio: string;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estado: EstadoVisiblePublico;
  badge_reservada: boolean;
  portada_url: string;
}

/**
 * Respuesta de `/public/propiedades` — el contrato DESIGN-029 usa el bloque de paginación
 * PLANO (`pagina`, `tamano_pagina`, `total`, `total_paginas`) junto a `data[]`, no el envelope
 * anidado `meta` que sí usa el admin (ADR-015). Se respeta exactamente lo que declara el
 * contrato — ver desviación documentada en `apps/api/.../portal-catalogo/CLAUDE.md`.
 */
export interface BusquedaCatalogoWire {
  pagina: number;
  tamano_pagina: number;
  total: number;
  total_paginas: number;
  data: PropiedadResumenWire[];
}

export interface TipoPropiedadPublicoWire {
  id: string;
  nombre: string;
}

export interface CiudadConteoWire {
  ciudad: string;
  total: number;
}

export interface MetaCatalogo {
  pagina: number;
  tamanoPagina: number;
  total: number;
  totalPaginas: number;
}

export interface ResultadoBusquedaCatalogo {
  propiedades: PropiedadResumen[];
  meta: MetaCatalogo;
}

export interface FiltrosCatalogo {
  tipoOperacion?: TipoOperacion;
  tipoPropiedad?: string;
  ciudad?: string;
  barrio?: string;
  precioMin?: number;
  precioMax?: number;
  pagina?: number;
  tamanoPagina?: number;
}

/** Mapea `PropiedadResumenWire` (snake_case) al modelo de dominio compartido (camelCase). */
export function aPropiedadResumen(wire: PropiedadResumenWire): PropiedadResumen {
  return {
    codigo: wire.codigo,
    titulo: wire.titulo,
    slug: wire.slug,
    tipoOperacion: wire.tipo_operacion,
    tipoPropiedad: wire.tipo_propiedad,
    ciudad: wire.ciudad,
    barrio: wire.barrio,
    precio: wire.precio,
    area: wire.area,
    habitaciones: wire.habitaciones,
    banos: wire.banos,
    estado: wire.estado,
    badgeReservada: wire.badge_reservada,
    portadaUrl: wire.portada_url,
  };
}

/** Construye el query string exacto del contrato (nombres snake_case, RN-024 filtros acumulativos). */
export function construirQueryCatalogo(filtros: FiltrosCatalogo): string {
  const params = new URLSearchParams();
  if (filtros.tipoOperacion) params.set("tipo_operacion", filtros.tipoOperacion);
  if (filtros.tipoPropiedad) params.set("tipo_propiedad", filtros.tipoPropiedad);
  if (filtros.ciudad) params.set("ciudad", filtros.ciudad);
  if (filtros.barrio) params.set("barrio", filtros.barrio);
  if (filtros.precioMin !== undefined) params.set("precio_min", String(filtros.precioMin));
  if (filtros.precioMax !== undefined) params.set("precio_max", String(filtros.precioMax));
  if (filtros.pagina && filtros.pagina > 1) params.set("pagina", String(filtros.pagina));
  if (filtros.tamanoPagina) params.set("tamano_pagina", String(filtros.tamanoPagina));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** `GET /public/propiedades` — CU-001/CU-002 (búsqueda paginada con filtros acumulativos). */
export async function buscarPropiedades(
  filtros: FiltrosCatalogo = {},
): Promise<RespuestaApi<ResultadoBusquedaCatalogo>> {
  const respuesta = await peticionApi<BusquedaCatalogoWire>(
    `/public/propiedades${construirQueryCatalogo(filtros)}`,
  );
  if (!respuesta.ok) return respuesta;

  return {
    ok: true,
    data: {
      propiedades: respuesta.data.data.map(aPropiedadResumen),
      meta: {
        pagina: respuesta.data.pagina,
        tamanoPagina: respuesta.data.tamano_pagina,
        total: respuesta.data.total,
        totalPaginas: respuesta.data.total_paginas,
      },
    },
  };
}

/** `GET /public/destacadas` — CU-003 (hasta 6 propiedades destacadas del home, RN-023). */
export async function listarDestacadas(): Promise<RespuestaApi<PropiedadResumen[]>> {
  const respuesta = await peticionApi<PropiedadResumenWire[]>("/public/destacadas");
  if (!respuesta.ok) return respuesta;
  return { ok: true, data: respuesta.data.map(aPropiedadResumen) };
}

/** `GET /public/tipos-propiedad` — catálogo para poblar el filtro de tipo de inmueble (ADR-005). */
export async function listarTiposPropiedad(): Promise<RespuestaApi<TipoPropiedadPublicoWire[]>> {
  return peticionApi<TipoPropiedadPublicoWire[]>("/public/tipos-propiedad");
}

/** `GET /public/ciudades` — ciudades con inventario visible, para poblar el filtro (GAP-002). */
export async function listarCiudades(): Promise<RespuestaApi<CiudadConteoWire[]>> {
  return peticionApi<CiudadConteoWire[]>("/public/ciudades");
}
