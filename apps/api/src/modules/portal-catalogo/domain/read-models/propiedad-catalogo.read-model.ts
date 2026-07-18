import type { EstadoVisiblePublico } from "../types/estado-visible-publico";
import type { TipoOperacion } from "../types/tipo-operacion";

/**
 * Proyección de solo lectura de una `Propiedad` para las tarjetas del catálogo público
 * (contrato DESIGN-029, schema `PropiedadResumen`). Es un read model — el portal NO administra
 * propiedades; el dueño de escritura es `admin-propiedades` (shared kernel de solo lectura,
 * DESIGN-027).
 *
 * PRIVACIDAD (ADR-011, RN-005): deliberadamente NO incluye la dirección cruda, el agente asignado,
 * las coordenadas ni el historial. El catálogo solo expone el subconjunto seguro de la tarjeta;
 * la coordenada aproximada del mapa vive en la ficha de detalle (portal-detalle), no aquí.
 *
 * La foto de portada NO forma parte de este read model: es composición del bounded context
 * `admin-multimedia` y se resuelve por su query-port en la capa de aplicación (ver
 * `EnriquecedorPortadasService`).
 */
export interface PropiedadCatalogo {
  /** Identificador interno — usado para resolver la portada vía `MultimediaQueryPort`; no se expone en el wire. */
  id: string;
  codigo: string;
  titulo: string;
  slug: string;
  tipoOperacion: TipoOperacion;
  /** Nombre del tipo de propiedad (mapea a `tipo_propiedad` del contrato). */
  tipoPropiedadNombre: string;
  ciudad: string;
  /** `null` cuando la propiedad no tiene barrio cargado (columna opcional en el modelo). */
  barrio: string | null;
  /** Precio en COP entero (RN-017). */
  precio: number;
  /** Área en m² (RN-018). */
  area: number;
  habitaciones: number;
  banos: number;
  estado: EstadoVisiblePublico;
  destacada: boolean;
  /** Fecha de publicación al portal — señal de recencia para el orden (RN-024) y el fallback de destacadas (RN-023). */
  publicadaEn: Date | null;
  createdAt: Date;
}
