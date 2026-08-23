import { DominioError } from "../../../../common/errors/dominio-error.base";

/** La propiedad sobre la que se opera la galería no existe. */
export class PropiedadNoEncontradaError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor() {
    super("La propiedad solicitada no existe.");
  }
}

/** RN-010 — un Agente intenta gestionar la multimedia de una propiedad que no es suya. */
export class SinPermisoMultimediaError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("No tenés permiso para gestionar la multimedia de esta propiedad.");
  }
}

/** GAP-001 / ADR-008 — la carga excedería el máximo de 10 fotos por propiedad. */
export class MaximoFotosExcedidoError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("Se excedería el máximo de 10 fotos por propiedad.");
  }
}

/** La foto referenciada (portada, reorden o eliminación) no pertenece a la galería de la propiedad. */
export class FotoNoEncontradaError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor() {
    super("La foto solicitada no existe en esta propiedad.");
  }
}

/** RN-031 — el nuevo orden no coincide exactamente con las fotos actuales de la galería. */
export class OrdenFotosInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    super(
      "El orden enviado debe incluir exactamente las fotos actuales de la propiedad, sin repeticiones ni faltantes.",
    );
  }
}

/** ADR-008 — no se puede eliminar la última foto de una propiedad visible en el portal. */
export class UltimaFotoPropiedadVisibleError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor() {
    super("No se puede eliminar la última foto de una propiedad visible en el portal.");
  }
}
