import type { Foto } from "./propiedades-types";

/**
 * Validación cliente y lógica pura de la galería de fotos (spec-004 RN-006, RN-014, RN-028,
 * RN-029, RN-030, RN-031, RN-032; ADR-008; gaps-admin-multimedia GAP-001 resuelto: máx. 10 fotos,
 * mín. 1 para publicar). Espejo *no autoritativo* de las reglas del backend — el servidor decide
 * con el 207/409/422 real (RN-028: el lote se procesa por archivo, los inválidos no cancelan los
 * válidos); esto solo evita subidas que sabemos que van a fallar y guía al usuario antes de
 * viajar a la red.
 */

/** RN-029 — únicamente JPG/JPEG, PNG y WEBP. */
export const FORMATOS_MIME_PERMITIDOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const EXTENSIONES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp"];

/** RN-030 — 10 MB antes de optimización. */
export const PESO_MAXIMO_BYTES = 10 * 1024 * 1024;

/** ADR-008 / gaps-admin-multimedia GAP-001 (resuelto 2026-07-08). */
export const MAX_FOTOS_POR_PROPIEDAD = 10;
export const MIN_FOTOS_PARA_PUBLICAR = 1;

function tieneExtensionPermitida(nombreArchivo: string): boolean {
  const nombre = nombreArchivo.toLowerCase();
  return EXTENSIONES_PERMITIDAS.some((ext) => nombre.endsWith(ext));
}

/**
 * Formato válido (RN-029). Prioriza el MIME type reportado por el browser; si viene vacío
 * (algunos navegadores no lo completan para ciertos archivos locales) cae a la extensión del
 * nombre de archivo.
 */
export function validarFormatoImagen(archivo: File): boolean {
  if (archivo.type !== "") return (FORMATOS_MIME_PERMITIDOS as readonly string[]).includes(archivo.type);
  return tieneExtensionPermitida(archivo.name);
}

/** Peso válido (RN-030) — mayor a 0 (descarta archivos vacíos/corruptos) y hasta 10 MB. */
export function validarPesoImagen(archivo: File): boolean {
  return archivo.size > 0 && archivo.size <= PESO_MAXIMO_BYTES;
}

export interface FotoRechazadaCliente {
  archivo: File;
  motivo: string;
}

export interface ResultadoValidacionLoteFotos {
  /** Archivos que pasan formato + peso + cupo disponible — listos para subir. */
  validos: File[];
  rechazados: FotoRechazadaCliente[];
}

/**
 * Valida un lote completo antes de subir (CU-001, RN-028): cada archivo se evalúa
 * individualmente (formato → peso → cupo disponible, en ese orden) y los inválidos no bloquean a
 * los válidos. Si el lote excede el cupo restante hasta `MAX_FOTOS_POR_PROPIEDAD`, se aceptan los
 * primeros N válidos (por orden de selección) y el resto se rechaza por "cupo excedido".
 */
export function validarLoteFotos(archivos: File[], fotosActualesCount: number): ResultadoValidacionLoteFotos {
  const rechazados: FotoRechazadaCliente[] = [];
  const validosFormatoPeso: File[] = [];

  for (const archivo of archivos) {
    if (!validarFormatoImagen(archivo)) {
      rechazados.push({ archivo, motivo: "Formato no compatible. Usá JPG, PNG o WEBP." });
      continue;
    }
    if (!validarPesoImagen(archivo)) {
      rechazados.push({ archivo, motivo: "El archivo supera el tamaño máximo de 10 MB." });
      continue;
    }
    validosFormatoPeso.push(archivo);
  }

  const espacioDisponible = Math.max(0, MAX_FOTOS_POR_PROPIEDAD - fotosActualesCount);
  const validos = validosFormatoPeso.slice(0, espacioDisponible);
  const excedentes = validosFormatoPeso.slice(espacioDisponible);
  for (const archivo of excedentes) {
    rechazados.push({ archivo, motivo: `Se alcanzó el máximo de ${MAX_FOTOS_POR_PROPIEDAD} fotos por propiedad.` });
  }

  return { validos, rechazados };
}

/** Arma el `FormData` multipart del contrato (`POST .../fotos`, campo repetido `archivos`). */
export function construirFormDataFotos(archivos: File[]): FormData {
  const formData = new FormData();
  for (const archivo of archivos) formData.append("archivos", archivo);
  return formData;
}

/** Orden de visualización (RN-031) — no asume que el array ya venga ordenado del backend. */
export function ordenarFotosPorOrden(fotos: Foto[]): Foto[] {
  return [...fotos].sort((a, b) => a.orden - b.orden);
}

/**
 * Nuevo orden de IDs tras mover una foto una posición hacia arriba (RN-031, controles
 * alternativos al drag-and-drop). Si la foto ya es la primera o no existe, retorna el orden
 * actual sin cambios.
 */
export function moverFotoArriba(fotosOrdenadas: Foto[], fotoId: string): string[] {
  const ids = fotosOrdenadas.map((f) => f.id);
  const indice = ids.indexOf(fotoId);
  if (indice <= 0) return ids;
  [ids[indice - 1], ids[indice]] = [ids[indice], ids[indice - 1]];
  return ids;
}

/** Análogo a `moverFotoArriba` pero hacia abajo — sin cambios si ya es la última o no existe. */
export function moverFotoAbajo(fotosOrdenadas: Foto[], fotoId: string): string[] {
  const ids = fotosOrdenadas.map((f) => f.id);
  const indice = ids.indexOf(fotoId);
  if (indice === -1 || indice >= ids.length - 1) return ids;
  [ids[indice], ids[indice + 1]] = [ids[indice + 1], ids[indice]];
  return ids;
}
