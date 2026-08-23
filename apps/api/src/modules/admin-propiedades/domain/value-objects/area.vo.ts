import { AreaInvalidaError } from "../errors/dominio-propiedades.errors";

/**
 * Value Object Area — entero positivo en metros cuadrados (RN-018). No admite decimales ni
 * valores ≤ 0.
 */
export class Area {
  private constructor(private readonly metrosCuadrados: number) {}

  static crear(input: number, campo = "area"): Area {
    if (typeof input !== "number" || !Number.isInteger(input) || input < 1) {
      throw new AreaInvalidaError(campo);
    }
    return new Area(input);
  }

  get valor(): number {
    return this.metrosCuadrados;
  }
}
