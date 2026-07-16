import { construirMetaPaginacion, type MetaPaginacion } from "@arrendadora/shared";
import type { Propiedad } from "../../../domain/entities/propiedad.entity";
import type { CatalogoItem } from "../../../domain/entities/catalogo-item.entity";
import type { HistorialEstadoLectura } from "../../../domain/ports/historial-estado.repository.port";

/**
 * Shapes del wire (snake_case) del contrato admin (DESIGN-028, ADR-015). Se declaran locales al
 * módulo — mismo criterio que `auth-usuarios` con `PaginacionMetaWire` — para no acoplar
 * `@arrendadora/shared` a este contrato ni requerir su rebuild.
 *
 * DESVIACIONES documentadas respecto al schema `Propiedad` del OpenAPI:
 * - `amenidades[]` expone `{ amenidad_id, cantidad }` SIN `nombre`: el aggregate solo referencia
 *   ids; el nombre lo resuelve el frontend desde el catálogo `/admin/amenidades` que ya carga
 *   (evita un join N+1 en la lectura del aggregate).
 * - `fotos[]` se omite: la multimedia es un bounded context aparte (admin-multimedia, spec-004),
 *   aún no implementado. Se incorporará cuando ese contexto exista.
 */
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

/** Mapea el aggregate al shape exacto del contrato `Propiedad` (DESIGN-028). */
export function aPropiedadWire(propiedad: Propiedad): PropiedadWire {
  const p = propiedad.toProps();
  return {
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
