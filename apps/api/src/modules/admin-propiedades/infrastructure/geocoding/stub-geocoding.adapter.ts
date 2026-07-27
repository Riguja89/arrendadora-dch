import { Injectable, Logger } from "@nestjs/common";
import type { GeocodingPort, GeocodingResultado } from "../../domain/ports/geocoding.port";

/**
 * Adaptador **stub/dev** del `GeocodingPort` (ADR-011) — MVP/dev/tests SIN credenciales de Google
 * Maps. Devuelve coordenadas determinísticas derivadas de la dirección (hash simple, sin
 * dependencias externas) para que el flujo sea reproducible. Convención de prueba: una dirección
 * que contenga `sin-geocodificar` simula que el proveedor no encontró la dirección (RN-033,
 * excepción) para poder ejercitar el camino 422 sin mocks adicionales.
 *
 * Reemplazable por `GoogleGeocodingAdapter` cambiando solo el binding del módulo (env
 * `GEOCODING_DRIVER=google`), sin tocar dominio ni casos de uso. Mismo patrón que
 * `StubVerificadorAdapter` (antibot) y `LocalAlmacenamientoAdapter` (storage).
 */
@Injectable()
export class StubGeocodingAdapter implements GeocodingPort {
  private readonly logger = new Logger(StubGeocodingAdapter.name);

  async geocodificar(direccion: string): Promise<GeocodingResultado> {
    const normalizado = direccion.toLowerCase();
    if (normalizado.includes("sin-geocodificar")) {
      this.logger.warn(`[geocoding:stub] dirección simulada como NO encontrada: "${direccion}"`);
      return { encontrado: false, latitud: null, longitud: null };
    }
    this.logger.log(
      `[geocoding:stub] direccion="${direccion}" — Google Geocoding no configurado (ADR-011); coordenadas determinísticas.`,
    );
    return { encontrado: true, ...coordenadasDeterministicas(direccion) };
  }
}

/**
 * Deriva un lat/long estable (hash FNV-1a simple) a partir del string de dirección — solo para
 * tener un stub plausible y reproducible en dev/tests, dentro del rango aproximado de Colombia
 * continental (no es geocodificación real).
 */
function coordenadasDeterministicas(direccion: string): { latitud: number; longitud: number } {
  let hash = 0x811c9dc5;
  for (let i = 0; i < direccion.length; i++) {
    hash ^= direccion.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hashPositivo = hash >>> 0;
  const latitud = 4 + (hashPositivo % 1000) / 1000; // 4.000 .. 4.999 (banda de Bogotá)
  const longitud = -76 - ((hashPositivo >>> 10) % 1000) / 1000; // -76.000 .. -76.999
  return { latitud: Number(latitud.toFixed(6)), longitud: Number(longitud.toFixed(6)) };
}
