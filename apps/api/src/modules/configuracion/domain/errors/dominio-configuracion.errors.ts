import type { DetalleErrorCampo } from "@arrendadora/shared";
import { DominioError } from "../../../../common/errors/dominio-error.base";

/**
 * Errores de negocio del bounded context `configuracion` (ADR-016). Cada uno conoce su
 * `httpStatus`/`codigo` (ADR-015) — el `AllExceptionsFilter` global los traduce al envelope de
 * error API-wide. Mapean a 422 `ErrorValidacion` (contrato DESIGN-028, `PUT /admin/configuracion`).
 * Los `campo` de `detalles[]` usan snake_case para coincidir con el shape del request (contrato).
 */

/** ADR-012 — el número central de WhatsApp no tiene un formato válido. */
export class NumeroWhatsappInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      {
        campo: "whatsapp_numero_central",
        mensaje: "El número de WhatsApp no es válido. Ingresá un número colombiano de 10 dígitos.",
      },
    ];
    super("El número de WhatsApp no es válido.", detalles);
  }
}

/** GAP-002 — la plantilla de mensaje está vacía o contiene un marcador no permitido. */
export class PlantillaMensajeInvalidaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor(mensaje = "La plantilla del mensaje no es válida. Solo se admite el marcador {codigo}.") {
    const detalles: DetalleErrorCampo[] = [{ campo: "whatsapp_plantilla_mensaje", mensaje }];
    super(mensaje, detalles);
  }
}

/** RN-014 — el nombre de la inmobiliaria es obligatorio. */
export class NombreInmobiliariaInvalidoError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      { campo: "nombre_inmobiliaria", mensaje: "El nombre de la inmobiliaria es obligatorio." },
    ];
    super("El nombre de la inmobiliaria es obligatorio.", detalles);
  }
}

/** RN-008 — la imagen genérica de fallback debe ser una URL http(s) válida. */
export class ImagenGenericaUrlInvalidaError extends DominioError {
  readonly httpStatus = 422;
  readonly codigo = "UNPROCESSABLE_ENTITY" as const;
  constructor() {
    const detalles: DetalleErrorCampo[] = [
      { campo: "imagen_generica_url", mensaje: "La imagen genérica debe ser una URL válida (http o https)." },
    ];
    super("La imagen genérica debe ser una URL válida.", detalles);
  }
}
