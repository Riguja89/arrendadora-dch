import type { TipoOperacion } from "@arrendadora/shared";

/**
 * Tipos administrativos de Propiedad — subconjunto del contrato OpenAPI admin
 * (`docs/architecture/contracts/2026-07-03-001-DESIGN-028-openapi-admin-api.yaml`, sección
 * Propiedades/Multimedia/Catálogos, schemas `Propiedad` / `PropiedadCrear` / `PropiedadEditar` /
 * `Foto` / `HistorialEstado` / `TipoPropiedad` / `Amenidad`).
 *
 * Nota de nomenclatura (igual criterio que `auth.ts`): estos tipos describen el **shape exacto
 * del JSON sobre el wire** (snake_case, ADR-015) — difieren de `propiedad.ts` en
 * `@arrendadora/shared`, que modela el shape **público** del portal (camelCase, contrato
 * DESIGN-029, campos más reducidos). El panel administrativo necesita más campos (código,
 * dirección privada, agente asignado, estado de archivado, coordenadas) y otra convención de
 * casing — por eso se define localmente en vez de reutilizar `PropiedadResumen`/`PropiedadDetalle`.
 */

export { type TipoOperacion };

/** Máquina de estados de la propiedad (RN-012, ADR-006). */
export type EstadoPropiedad = "disponible" | "reservada" | "arrendada_vendida";

export interface PropiedadAmenidad {
  amenidad_id: string;
  nombre: string;
  /** Checkbox + cantidad (ADR-005, gaps-propiedades GAP-003). */
  cantidad: number;
}

export interface PropiedadAmenidadCrear {
  amenidad_id: string;
  cantidad: number;
}

export type FormatoFoto = "jpg" | "png" | "webp";

export interface Foto {
  id: string;
  propiedad_id: string;
  orden: number;
  es_portada: boolean;
  formato_original: FormatoFoto;
  url_optimizada: string;
  url_card: string;
  url_thumbnail: string;
  created_at: string;
}

export interface Propiedad {
  id: string;
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
  tipo_operacion: TipoOperacion;
  tipo_propiedad_id: string;
  ciudad: string;
  barrio: string;
  direccion: string | null;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  estado: EstadoPropiedad;
  destacada: boolean;
  archivada: boolean;
  agente_id: string | null;
  latitud: number | null;
  longitud: number | null;
  amenidades: PropiedadAmenidad[];
  fotos: Foto[];
  publicada_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropiedadCrear {
  titulo: string;
  descripcion: string;
  tipo_operacion: TipoOperacion;
  tipo_propiedad_id: string;
  ciudad: string;
  barrio: string;
  direccion?: string | null;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato?: number | null;
  parqueaderos?: number | null;
  destacada?: boolean;
  /** Solo el Administrador puede asignar otro agente (RN-011); para Agente el backend lo ignora. */
  agente_id?: string | null;
  amenidades?: PropiedadAmenidadCrear[];
}

/** Mismos campos que la creación — el estado se gestiona por el endpoint dedicado `.../estado`. */
export type PropiedadEditar = PropiedadCrear;

export interface HistorialEstado {
  id: string;
  estado_anterior: EstadoPropiedad;
  estado_nuevo: EstadoPropiedad;
  usuario_id: string;
  usuario_nombre: string;
  nota: string | null;
  cambiado_en: string;
}

export interface CambiarEstadoPropiedadRequest {
  estado_nuevo: EstadoPropiedad;
  nota?: string | null;
}

export interface UbicacionActualizar {
  latitud?: number | null;
  longitud?: number | null;
  geocodificar_direccion?: boolean;
}

export interface UbicacionRespuesta {
  latitud: number | null;
  longitud: number | null;
}

/** Catálogos administrables (ADR-005, GAP-002/GAP-003). */
export interface TipoPropiedadCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface Amenidad {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface CatalogoCrear {
  nombre: string;
  orden?: number | null;
}

/** Filtros de listado — GET /admin/propiedades (spec-003 CU-005, HU-004). */
export interface FiltrosPropiedades {
  estado?: EstadoPropiedad;
  tipo_operacion?: TipoOperacion;
  tipo_propiedad_id?: string;
  /** UUID del agente o `"me"` — filtro visible solo para Administrador (HU-004 DoD). */
  agente?: string;
  archivada?: boolean;
  /** Búsqueda por texto libre: título, código, dirección (HU-004). */
  q?: string;
  pagina?: number;
  tamano_pagina?: number;
}

export interface PaginacionMetaWire {
  pagina: number;
  tamano_pagina: number;
  total: number;
  total_paginas: number;
}

export interface PropiedadesPaginadas extends PaginacionMetaWire {
  data: Propiedad[];
}
