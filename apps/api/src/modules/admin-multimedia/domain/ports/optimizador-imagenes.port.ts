import type { FormatoImagen } from "../value-objects/formato-imagen.vo";
import type { ObjetoVariante } from "./almacenamiento-objetos.port";

export const OPTIMIZADOR_IMAGENES = Symbol("OptimizadorImagenesPort");

/**
 * Puerto de optimización de imágenes (RN-006, ADR-008). Recibe el binario original ya validado y
 * devuelve las variantes a almacenar (original optimizado, card, thumbnail). Detrás del puerto vive
 * el pipeline concreto (Sharp en producción; un passthrough para dev/tests). El dominio no depende
 * de la librería de imágenes.
 */
export interface OptimizadorImagenesPort {
  optimizar(input: { datos: Buffer; formato: FormatoImagen }): Promise<ObjetoVariante[]>;
}
