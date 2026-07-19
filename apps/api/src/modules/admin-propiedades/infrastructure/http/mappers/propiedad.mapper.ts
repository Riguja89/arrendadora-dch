import { construirMetaPaginacion, type MetaPaginacion } from "@arrendadora/shared";
import type { Propiedad } from "../../../domain/entities/propiedad.entity";
import type { CatalogoItem } from "../../../domain/entities/catalogo-item.entity";
import type { HistorialEstadoLectura } from "../../../domain/ports/historial-estado.repository.port";
import type { FotoPublica } from "../../../../admin-multimedia/domain/ports/multimedia-query.port";

/**
 * Shapes del wire (snake_case) del contrato admin (DESIGN-028, ADR-015). Se declaran locales al
 * módulo — mismo criterio que `auth-usuarios` con `PaginacionMetaWire` — para no acoplar
 * `@arrendadora/shared` a este contrato ni requerir su rebuild.
 *
 * DESVIACIONES documentadas respecto al schema `Propiedad` del OpenAPI:
 * - `amenidades[]` expone `{ amenidad_id, cantidad }` SIN `nombre`: el aggregate solo referencia
 *   ids; el nombre lo resuelve el frontend desde el catálogo `/admin/amenidades` que ya carga
 *   (evita un join N+1 en la lectura del aggregate).
 * - `fotos[]` se puebla en la ficha (`GET /admin/propiedades/{id}`) consumiendo el
 *   `MultimediaQueryPort` (token `MULTIMEDIA_QUERY`) que exporta `admin-multimedia`, in-process
 *   (DESIGN-027). El caso de uso `obtener-propiedad` resuelve las fotos y las entrega ya listas al
 *   mapper (que se mantiene puro). En los endpoints que NO son la ficha (listado, crear, editar,
 *   duplicar, archivar, restaurar, estado) `fotos` se omite: son opcionales en el contrato y
 *   resolverlas ahí solo agregaría un N+1 que el frontend de la ficha no consume desde esas
 *   respuestas.
 */

/**
 * Item de `fotos[]` del schema `Propiedad` (DESIGN-028, mismo shape que el schema `Foto`). Se mapea
 * LOCALMENTE desde `FotoPublica` (la proyección camelCase del query port) en vez de reusar el
 * `aFotoWire` de `admin-multimedia`: ese helper mapea el aggregate `Foto` + `AlmacenamientoObjetosPort`
 * (otra firma) y su `FotoWire` vive en la capa de infraestructura de otro BC. Declararlo local honra
 * el mismo criterio que `PropiedadWire`/`PaginacionMetaWire` (wire propio del módulo, sin acoplarse a
 * la infraestructura de `admin-multimedia`). El `propiedad_id` del contrato se inyecta desde la
 * propiedad en contexto — `FotoPublica` no lo transporta (es siempre la propiedad consultada).
 */
export interface PropiedadFotoWire {
  id: string;
  propiedad_id: string;
  orden: number;
  es_portada: boolean;
  formato_original: string;
  url_optimizada: string;
  url_card: string;
  url_thumbnail: string;
  created_at: string;
}

export interface PropiedadAmenidadWire {
  amenidad_id: string;
  cantidad: number;
}

export interface PropiedadWire {
  id: string;
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
  tipo_operacion: string;
  tipo_propiedad_id: string;
  ciudad: string;
  barrio: string | null;
  direccion: string | null;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  estado: string;
  destacada: boolean;
  archivada: boolean;
  agente_id: string | null;
  latitud: number | null;
  longitud: number | null;
  amenidades: PropiedadAmenidadWire[];
  fotos?: PropiedadFotoWire[];
  publicada_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistorialEstadoWire {
  id: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_id: string;
  usuario_nombre: string;
  nota: string | null;
  cambiado_en: string;
}

export interface CatalogoWire {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface PaginacionMetaWire {
  pagina: number;
  tamano_pagina: number;
  total: number;
  total_paginas: number;
}

/** Mapea una `FotoPublica` (query port de `admin-multimedia`) al item snake_case de `fotos[]`. */
export function aPropiedadFotoWire(foto: FotoPublica, propiedadId: string): PropiedadFotoWire {
  return {
    id: foto.id,
    propiedad_id: propiedadId,
    orden: foto.orden,
    es_portada: foto.esPortada,
    formato_original: foto.formatoOriginal,
    url_optimizada: foto.urlOptimizada,
    url_card: foto.urlCard,
    url_thumbnail: foto.urlThumbnail,
    created_at: foto.createdAt.toISOString(),
  };
}

/**
 * Mapea el aggregate al shape exacto del contrato `Propiedad` (DESIGN-028). Cuando el llamador
 * resuelve las fotos (ficha), las pasa ya listas (`FotoPublica[]`, ordenadas con la portada primero
 * por el query port) y el mapper solo las proyecta a snake_case. Sin `fotos` → el campo se omite
 * (opcional en el contrato) para no afirmar `[]` en endpoints que no las consultan.
 */
export function aPropiedadWire(propiedad: Propiedad, fotos?: FotoPublica[]): PropiedadWire {
  const p = propiedad.toProps();
  const wire: PropiedadWire = {
    id: p.id,
    codigo: p.codigo,
    titulo: p.titulo,
    slug: p.slug,
    descripcion: p.descripcion,
    tipo_operacion: p.tipoOperacion,
    tipo_propiedad_id: p.tipoPropiedadId,
    ciudad: p.ciudad,
    barrio: p.barrio,
    direccion: p.direccion,
    precio: p.precio,
    area: p.area,
    habitaciones: p.habitaciones,
    banos: p.banos,
    estrato: p.estrato,
    parqueaderos: p.parqueaderos,
    estado: p.estado,
    destacada: p.destacada,
    archivada: p.archivada,
    agente_id: p.agenteId,
    latitud: p.latitud,
    longitud: p.longitud,
    amenidades: p.amenidades.map((a) => ({ amenidad_id: a.amenidadId, cantidad: a.cantidad })),
    publicada_en: p.publicadaEn ? p.publicadaEn.toISOString() : null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
  if (fotos !== undefined) {
    wire.fotos = fotos.map((foto) => aPropiedadFotoWire(foto, p.id));
  }
  return wire;
}

/** Mapea una entrada de historial al contrato `HistorialEstado` (DESIGN-028). */
export function aHistorialWire(entrada: HistorialEstadoLectura): HistorialEstadoWire {
  return {
    id: entrada.id,
    estado_anterior: entrada.estadoAnterior,
    estado_nuevo: entrada.estadoNuevo,
    usuario_id: entrada.usuarioId,
    usuario_nombre: entrada.usuarioNombre,
    nota: entrada.nota,
    cambiado_en: entrada.cambiadoEn.toISOString(),
  };
}

/** Mapea un ítem de catálogo al contrato `TipoPropiedad`/`Amenidad` (DESIGN-028). */
export function aCatalogoWire(item: CatalogoItem): CatalogoWire {
  const c = item.toProps();
  return { id: c.id, nombre: c.nombre, activo: c.activo, orden: c.orden };
}

/** Bloque `meta` de paginación snake_case (ADR-015), reutilizando `construirMetaPaginacion`. */
export function aPaginacionWire(total: number, pagina: number, tamanoPagina: number): PaginacionMetaWire {
  const meta: MetaPaginacion = construirMetaPaginacion(total, { pagina, tamanoPagina });
  return {
    pagina: meta.pagina,
    tamano_pagina: meta.tamanoPagina,
    total: meta.total,
    total_paginas: meta.totalPaginas,
  };
}
