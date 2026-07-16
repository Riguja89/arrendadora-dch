import type { DetalleErrorCampo } from "@arrendadora/shared";
import { DominioError } from "../../../../common/errors/dominio-error.base";

/** GET/PUT/PATCH /admin/propiedades/{id} — la propiedad no existe. */
export class PropiedadNoEncontradaError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor() {
    super("La propiedad solicitada no existe.");
  }
}

/** RN-010 — un Agente intenta operar sobre una propiedad que no es suya. */
export class SinPermisoPropiedadError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("No tenés permiso para gestionar esta propiedad.");
  }
}

/** RN-012 — la transición de estado solicitada no está permitida por la máquina de estados. */
export class TransicionEstadoInvalidaError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "STATE_TRANSITION_INVALID" as const;
  constructor(mensaje = "La transición de estado solicitada no está permitida.") {
    super(mensaje);
  }
}

/** RN-012 — la reapertura `arrendada_vendida → disponible` está reservada al Administrador. */
export class ReaperturaSoloAdministradorError extends DominioError {
  readonly httpStatus = 403;
  readonly codigo = "FORBIDDEN" as const;
  constructor() {
    super("Solo el Administrador puede reabrir una propiedad marcada como arrendada o vendida.");
  }
}

/** RN-017 — el precio no es un entero positivo en COP. */
export class PrecioInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor(campo = "precio") {
    const detalles: DetalleErrorCampo[] = [
      { campo, mensaje: "El precio debe ser un número entero positivo en pesos colombianos, sin decimales." },
    ];
    super("El precio debe ser un número entero positivo en pesos colombianos, sin decimales.", detalles);
  }
}

/** RN-018 — el área no es un entero positivo en metros cuadrados. */
export class AreaInvalidaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor(campo = "area") {
    const detalles: DetalleErrorCampo[] = [
      { campo, mensaje: "El área debe ser un número entero positivo en metros cuadrados." },
    ];
    super("El área debe ser un número entero positivo en metros cuadrados.", detalles);
  }
}

/** POST/PUT /admin/propiedades — el tipo de propiedad referenciado no existe o está inactivo. */
export class TipoPropiedadInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      { campo: "tipo_propiedad_id", mensaje: "El tipo de propiedad seleccionado no es válido." },
    ];
    super("El tipo de propiedad seleccionado no es válido.", detalles);
  }
}

/** POST/PUT /admin/propiedades — una o más amenidades referenciadas no existen o están inactivas. */
export class AmenidadInvalidaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      { campo: "amenidades", mensaje: "Una o más amenidades seleccionadas no son válidas." },
    ];
    super("Una o más amenidades seleccionadas no son válidas.", detalles);
  }
}

/**
 * GET/PATCH/DELETE /admin/{catalogo}/{id} — el ítem de catálogo (tipo o amenidad) no existe. El
 * mensaje llega ya redactado con la concordancia de género correcta (ver `EtiquetasCatalogo`).
 */
export class CatalogoNoEncontradoError extends DominioError {
  readonly httpStatus = 404;
  readonly codigo = "NOT_FOUND" as const;
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** POST/PATCH /admin/{catalogo} — ya existe un ítem de catálogo con ese nombre (ADR-005). */
export class NombreCatalogoDuplicadoError extends DominioError {
  readonly httpStatus = 409;
  readonly codigo = "CONFLICT" as const;
  constructor(mensaje: string) {
    super(mensaje);
  }
}
