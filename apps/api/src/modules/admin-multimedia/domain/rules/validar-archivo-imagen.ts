import type { FormatoImagen } from "../value-objects/formato-imagen.vo";
import { MIME_A_FORMATO, TAMANO_MAX_BYTES } from "./multimedia-constantes";

/** Un archivo entrante a validar antes de optimizar/almacenar (RN-028/029/030). */
export interface ArchivoEntrante {
  nombre: string;
  mime: string;
  tamanoBytes: number;
}

/** Resultado de validar un archivo del lote: aceptado (con su formato canónico) o rechazado con motivo. */
export type ResultadoValidacionArchivo =
  | { valido: true; formato: FormatoImagen }
  | { valido: false; motivo: string };

/**
 * Valida un archivo individual del lote (RN-028: los inválidos no cancelan a los válidos). No lanza
 * — devuelve un resultado que el caso de uso acumula para reportar `rechazadas[]` (contrato 207).
 *
 * - Formato no permitido (RN-029) → mensaje literal del spec.
 * - Peso mayor a 10 MB (RN-030) → "Tamaño excedido".
 */
export function validarArchivoImagen(archivo: ArchivoEntrante): ResultadoValidacionArchivo {
  const formato = MIME_A_FORMATO[archivo.mime.toLowerCase()];
  if (!formato) {
    return { valido: false, motivo: "Formato no compatible. Usá JPG, PNG o WEBP." };
  }
  if (archivo.tamanoBytes > TAMANO_MAX_BYTES) {
    return { valido: false, motivo: "Tamaño excedido: el peso máximo por imagen es de 10 MB." };
  }
  return { valido: true, formato };
}
