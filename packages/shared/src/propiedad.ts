/**
 * Tipos públicos de Propiedad — subconjunto del contrato OpenAPI del portal
 * (`docs/architecture/contracts/2026-07-03-001-DESIGN-029-openapi-portal-api.yaml`,
 * schemas `PropiedadResumen` / `PropiedadDetalle`).
 *
 * Scaffolding: solo los campos usados por el esqueleto de portal/admin. Se amplía spec por
 * spec en la siguiente iteración de Construir — no duplicar estos tipos en las apps.
 */

export type TipoOperacion = "arriendo" | "venta";

export type EstadoVisiblePublico = "disponible" | "reservada";

export interface PropiedadResumen {
  codigo: string;
  titulo: string;
  slug: string;
  tipoOperacion: TipoOperacion;
  tipoPropiedad: string;
  ciudad: string;
  barrio: string;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estado: EstadoVisiblePublico;
  badgeReservada: boolean;
  portadaUrl: string;
}

export interface UbicacionAproximada {
  latitud: number;
  longitud: number;
}

export interface OpenGraphPropiedad {
  titulo: string;
  descripcion: string;
  imagen: string;
  url: string;
}

export interface PropiedadDetalle extends Omit<PropiedadResumen, "portadaUrl"> {
  descripcion: string;
  estrato: number | null;
  parqueaderos: number | null;
  amenidades: Array<{ nombre: string; cantidad: number }>;
  galeria: Array<{
    urlOptimizada: string;
    urlCard: string;
    urlThumbnail: string;
    esPortada: boolean;
  }>;
  ubicacion: UbicacionAproximada | null;
  openGraph: OpenGraphPropiedad;
}
