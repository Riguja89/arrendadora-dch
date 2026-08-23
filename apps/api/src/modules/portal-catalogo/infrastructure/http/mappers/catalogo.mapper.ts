import { construirMetaPaginacion } from "@arrendadora/shared";
import type { TarjetaCatalogo } from "../../../application/use-cases/buscar-catalogo.use-case";
import type { TipoPropiedadPublico } from "../../../domain/read-models/tipo-propiedad-publico.read-model";
import type { CiudadConteo } from "../../../domain/read-models/ciudad-conteo.read-model";
import { esBadgeReservada } from "../../../domain/rules/visibilidad-publica";

/**
 * Shapes del wire (snake_case) del contrato portal (DESIGN-029). Se declaran locales al módulo —
 * mismo criterio que `admin-propiedades`/`auth-usuarios`— para no acoplar `@arrendadora/shared` a
 * este contrato ni requerir su rebuild.
 */

/** `PropiedadResumen` del contrato — tarjeta de listado, subconjunto seguro (sin dirección, agente ni historial). */
export interface PropiedadResumenWire {
  codigo: string;
  titulo: string;
  slug: string;
  tipo_operacion: string;
  tipo_propiedad: string;
  ciudad: string;
  barrio: string;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estado: string;
  badge_reservada: boolean;
  portada_url: string;
}

/**
 * Respuesta paginada de `/public/propiedades` — el contrato DESIGN-029 usa el bloque de paginación
 * PLANO (`pagina`, `tamano_pagina`, `total`, `total_paginas`) junto a `data[]`, no el envelope
 * anidado `meta` del admin. Se respeta exactamente lo que declara el contrato.
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

/** Mapea una tarjeta (read model + portada) al `PropiedadResumen` del contrato (DESIGN-029). */
export function aPropiedadResumenWire(tarjeta: TarjetaCatalogo): PropiedadResumenWire {
  const p = tarjeta.propiedad;
  return {
    codigo: p.codigo,
    titulo: p.titulo,
    slug: p.slug,
    tipo_operacion: p.tipoOperacion,
    tipo_propiedad: p.tipoPropiedadNombre,
    ciudad: p.ciudad,
    // El contrato declara `barrio` como string; el modelo lo permite nulo → se proyecta cadena vacía.
    barrio: p.barrio ?? "",
    precio: p.precio,
    area: p.area,
    habitaciones: p.habitaciones,
    banos: p.banos,
    estado: p.estado,
    badge_reservada: esBadgeReservada(p.estado),
    portada_url: tarjeta.portadaUrl,
  };
}

/** Ensambla la respuesta paginada plana de `/public/propiedades` (DESIGN-029). */
export function aBusquedaCatalogoWire(
  items: TarjetaCatalogo[],
  total: number,
  pagina: number,
  tamanoPagina: number,
): BusquedaCatalogoWire {
  const meta = construirMetaPaginacion(total, { pagina, tamanoPagina });
  return {
    pagina: meta.pagina,
    tamano_pagina: meta.tamanoPagina,
    total: meta.total,
    total_paginas: meta.totalPaginas,
    data: items.map(aPropiedadResumenWire),
  };
}

export function aTipoPropiedadPublicoWire(tipo: TipoPropiedadPublico): TipoPropiedadPublicoWire {
  return { id: tipo.id, nombre: tipo.nombre };
}

export function aCiudadConteoWire(ciudad: CiudadConteo): CiudadConteoWire {
  return { ciudad: ciudad.ciudad, total: ciudad.total };
}
