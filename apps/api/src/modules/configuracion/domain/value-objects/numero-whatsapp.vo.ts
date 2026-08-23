import { NumeroWhatsappInvalidoError } from "../errors/dominio-configuracion.errors";

/** Caracteres de formato tolerados alrededor de los dígitos (espacios, `+`, guiones, paréntesis). */
const CARACTERES_VALIDOS = /^[+\d\s()-]+$/;
const MIN_DIGITOS = 10; // móvil colombiano local (3XX XXX XXXX)
const MAX_DIGITOS = 13; // con indicativo de país (+57 + 10 dígitos)

/**
 * Value Object del número central de WhatsApp (ADR-012). Normaliza (trim, colapsa espacios) y valida
 * el formato colombiano: solo caracteres de teléfono y entre 10 y 13 dígitos. No impone un
 * indicativo específico — tolera el número con o sin `+57` (RN de contacto, GAP-002).
 */
export class NumeroWhatsapp {
  private constructor(private readonly valorNormalizado: string) {}

  static crear(input: string): NumeroWhatsapp {
    const normalizado = (input ?? "").trim().replace(/\s+/g, " ");
    if (normalizado.length === 0 || !CARACTERES_VALIDOS.test(normalizado)) {
      throw new NumeroWhatsappInvalidoError();
    }
    const cantidadDigitos = (normalizado.match(/\d/g) ?? []).length;
    if (cantidadDigitos < MIN_DIGITOS || cantidadDigitos > MAX_DIGITOS) {
      throw new NumeroWhatsappInvalidoError();
    }
    return new NumeroWhatsapp(normalizado);
  }

  get valor(): string {
    return this.valorNormalizado;
  }

  toString(): string {
    return this.valorNormalizado;
  }
}
