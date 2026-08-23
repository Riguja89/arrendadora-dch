import { CoordenadasInvalidasError } from "../errors/dominio-propiedades.errors";

/**
 * Value Object Coordenadas — par latitud/longitud dentro del rango geográfico válido (RN-033,
 * ADR-011). Se valida como par porque una ubicación sin ambos componentes no es utilizable: si
 * cualquiera de los dos cae fuera de rango, la ubicación completa se rechaza.
 */
export class Coordenadas {
  private constructor(
    private readonly lat: number,
    private readonly lng: number,
  ) {}

  static crear(latitud: number, longitud: number): Coordenadas {
    if (typeof latitud !== "number" || Number.isNaN(latitud) || latitud < -90 || latitud > 90) {
      throw new CoordenadasInvalidasError("latitud");
    }
    if (typeof longitud !== "number" || Number.isNaN(longitud) || longitud < -180 || longitud > 180) {
      throw new CoordenadasInvalidasError("longitud");
    }
    return new Coordenadas(latitud, longitud);
  }

  get latitud(): number {
    return this.lat;
  }

  get longitud(): number {
    return this.lng;
  }
}
