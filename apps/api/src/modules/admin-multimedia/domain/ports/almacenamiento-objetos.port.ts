import type { VarianteImagen } from "../rules/multimedia-constantes";

export const ALMACENAMIENTO_OBJETOS = Symbol("AlmacenamientoObjetosPort");

/** Un binario de variante listo para subir al almacenamiento de objetos. */
export interface ObjetoVariante {
  variante: VarianteImagen;
  datos: Buffer;
  contentType: string;
}

/**
 * Puerto de almacenamiento de objetos (ADR-008 — `StoragePort`). Abstrae subir/eliminar/URL de los
 * binarios de imagen para que el dominio no conozca S3 ni ningún proveedor concreto. Adaptadores:
 * S3+CloudFront en producción, un adaptador local/no-op para dev y tests.
 */
export interface AlmacenamientoObjetosPort {
  /** Sube todas las variantes de una foto bajo su `s3KeyBase` (`{s3KeyBase}/{variante}.webp`). */
  subirVariantes(s3KeyBase: string, variantes: ObjetoVariante[]): Promise<void>;

  /** Elimina todos los objetos (todas las variantes) bajo los prefijos indicados. */
  eliminarPrefijos(s3KeyBases: string[]): Promise<void>;

  /** URL pública (CDN) de una variante concreta de una foto. Determinista a partir de la config. */
  urlDe(s3KeyBase: string, variante: VarianteImagen): string;
}
