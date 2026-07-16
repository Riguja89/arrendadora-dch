import type { CodigoError, DetalleErrorCampo } from "@arrendadora/shared";

/**
 * Base de errores de dominio/aplicación (cualquier bounded context). Cada error de negocio
 * conoce su propio mapeo HTTP (ADR-015) — el `AllExceptionsFilter` global lo traduce al
 * envelope de error API-wide sin necesidad de un `catch` por caso de uso.
 *
 * Sin dependencias de framework (Nest/Express) ni de infraestructura — solo tipos de
 * `@arrendadora/shared`. Puede importarse desde `domain/` de cualquier módulo sin romper la
 * regla de pureza de dominio (ADR-001).
 */
export abstract class DominioError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly codigo: CodigoError;
  readonly detalles?: DetalleErrorCampo[];

  protected constructor(message: string, detalles?: DetalleErrorCampo[]) {
    super(message);
    this.name = new.target.name;
    this.detalles = detalles;
  }
}
