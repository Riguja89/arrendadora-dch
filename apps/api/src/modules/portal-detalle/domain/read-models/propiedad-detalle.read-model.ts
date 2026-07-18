import type { EstadoVisiblePublico } from "../types/estado-visible-publico";
import type { TipoOperacion } from "../types/tipo-operacion";

/**
 * Una amenidad de la propiedad tal como se expone en la ficha (contrato DESIGN-029,
 * `PropiedadDetalle.amenidades[]`): solo el nombre y la cantidad, sin ids internos ni auditoría.
 */
export interface AmenidadDetalle {
  nombre: string;
  /** Cantidad de esa amenidad (≥ 1); p. ej. 2 baños auxiliares, 1 piscina. */
  cantidad: number;
}

/**
 * Proyección de solo lectura de una `Propiedad` para la ficha de detalle pública (contrato
 * DESIGN-029, schema `PropiedadDetalle`). Es un read model — el portal NO administra propiedades;
 * el dueño de escritura es `admin-propiedades` (shared kernel de solo lectura, DESIGN-027).
 *
 * PRIVACIDAD (ADR-011, GAP-004 opción B): expone `latitud`/`longitud` como la **zona aproximada**
 * del barrio/sector (las coordenadas que fija el agente representan el sector, no la puerta exacta),
 * pero NUNCA la `direccion` cruda — esa se entrega solo por WhatsApp. Tampoco expone el agente
 * asignado, el historial ni campos de auditoría.
 *
 * La galería de fotos NO forma parte de este read model: es composición del bounded context
 * `admin-multimedia` y se resuelve por su query-port en la capa de aplicación (RN-014).
 */
export interface PropiedadDetalle {
  /** Identificador interno — usado para resolver la galería vía `MultimediaQueryPort`; no se expone en el wire. */
  id: string;
  codigo: string;
  titulo: string;
  slug: string;
  descripcion: string;
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
  /** Estrato socioeconómico 1..6 (opcional en el modelo). */
  estrato: number | null;
  parqueaderos: number | null;
  estado: EstadoVisiblePublico;
  /** Coordenada aproximada de la zona (ADR-011). `null` cuando el agente aún no la fijó. */
  latitud: number | null;
  longitud: number | null;
  amenidades: AmenidadDetalle[];
}
