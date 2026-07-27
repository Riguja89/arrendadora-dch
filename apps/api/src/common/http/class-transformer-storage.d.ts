/**
 * Shim de tipos para el subpath interno de `class-transformer` usado por
 * `validation-pipe.factory.ts` para leer el alias público (`@Expose({ name })`) de un campo del
 * DTO al construir el envelope de error de validación (ADR-015).
 *
 * `class-transformer` NO expone `defaultMetadataStorage` desde su entrypoint público
 * (`class-transformer`) — solo desde `class-transformer/cjs/storage`, que no publica su propia
 * declaración de tipos. Este shim la reconstruye reusando el `.d.ts` público que el paquete SÍ
 * publica para `MetadataStorage` (`class-transformer/types/MetadataStorage`).
 */
declare module "class-transformer/cjs/storage" {
  import type { MetadataStorage } from "class-transformer/types/MetadataStorage";

  export const defaultMetadataStorage: MetadataStorage;
}
