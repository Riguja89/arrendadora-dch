import { PrecioInvalidoError } from "../errors/dominio-propiedades.errors";

/**
 * Value Object Precio — entero positivo en pesos colombianos (COP), sin decimales (RN-017).
 * El precio 0 y los negativos se rechazan: una propiedad publicable siempre tiene precio ≥ 1
 * (el estado borrador con precio 0 quedó fuera del alcance del MVP — GAP-004).
 */
export class Precio {
  private constructor(private readonly valorCop: number) {}

  static crear(input: number, campo = "precio"): Precio {
    if (typeof input !== "number" || !Number.isInteger(input) || input < 1) {
      throw new PrecioInvalidoError(campo);
    }
    return new Precio(input);
  }

  get valor(): number {
    return this.valorCop;
  }
}
