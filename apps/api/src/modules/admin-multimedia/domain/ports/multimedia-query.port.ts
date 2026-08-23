export const MULTIMEDIA_QUERY = Symbol("MultimediaQueryPort");

/**
 * Proyección pública de una foto para consumidores downstream (admin-propiedades cierra su `fotos[]`,
 * el portal arma la galería y el og:image, RN-014). Solo URLs y metadatos de presentación — sin
 * claves de almacenamiento ni auditoría.
 */
export interface FotoPublica {
  id: string;
  orden: number;
  esPortada: boolean;
  formatoOriginal: string;
  urlOptimizada: string;
  urlCard: string;
  urlThumbnail: string;
  createdAt: Date;
}

/**
 * Puerto de consulta de solo lectura que el módulo `admin-multimedia` **exporta** a otros bounded
 * contexts (ADR-008, patrón in-process del context map DESIGN-027). Permite a admin-propiedades y a
 * los contextos de portal leer las fotos de una propiedad SIN acoplarse al aggregate `GaleriaFotos`
 * ni pegarle a los endpoints admin. Las fotos vienen ordenadas (portada primero).
 */
export interface MultimediaQueryPort {
  listarFotosDePropiedad(propiedadId: string): Promise<FotoPublica[]>;
}
