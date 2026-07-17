import { PlantillaMensajeInvalidaError } from "../errors/dominio-configuracion.errors";

/** Único marcador permitido en la plantilla (GAP-002): se sustituye por el código de la propiedad. */
const MARCADOR_PERMITIDO = "{codigo}";
const MARCADORES_REGEX = /\{[^}]*\}/g;

/**
 * Value Object de la plantilla del mensaje de WhatsApp (GAP-002). Reglas:
 * - No puede estar vacía.
 * - Admite el marcador `{codigo}` (opcional), que el backend sustituye por el código de la
 *   propiedad al construir el deep link (ADR-012). Cualquier otro marcador `{...}` es inválido —
 *   evita placeholders que el sistema no sabe resolver.
 */
export class PlantillaMensaje {
  private constructor(private readonly valorNormalizado: string) {}

  static crear(input: string): PlantillaMensaje {
    const normalizado = (input ?? "").trim();
    if (normalizado.length === 0) {
      throw new PlantillaMensajeInvalidaError("La plantilla del mensaje es obligatoria.");
    }
    const marcadores = normalizado.match(MARCADORES_REGEX) ?? [];
    const hayMarcadorInvalido = marcadores.some((marcador) => marcador !== MARCADOR_PERMITIDO);
    if (hayMarcadorInvalido) {
      throw new PlantillaMensajeInvalidaError();
    }
    return new PlantillaMensaje(normalizado);
  }

  /** `true` si la plantilla incluye el marcador `{codigo}` (útil para el portal al armar el deep link). */
  get incluyeCodigo(): boolean {
    return this.valorNormalizado.includes(MARCADOR_PERMITIDO);
  }

  get valor(): string {
    return this.valorNormalizado;
  }

  toString(): string {
    return this.valorNormalizado;
  }
}
