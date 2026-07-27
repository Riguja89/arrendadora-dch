import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { GeocodingConfig } from "../../../../config/configuration";
import type { GeocodingPort, GeocodingResultado } from "../../domain/ports/geocoding.port";

/** Forma parcial de la respuesta de Google Geocoding API que nos interesa. */
interface RespuestaGeocodingGoogle {
  status: string;
  results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
}

/**
 * Adaptador de producción del `GeocodingPort` (ADR-011): geocodifica una dirección contra Google
 * Geocoding API usando la **API key** del backend (por env, restringida por IP, nunca en el
 * repo). Cualquier fallo (sin API key, HTTP no-ok, `status !== "OK"`, error de red) se traduce a
 * `encontrado: false` — nunca revienta el request: RN-033 exige que el panel pueda ofrecer el pin
 * manual como fallback en vez de un 5xx.
 */
@Injectable()
export class GoogleGeocodingAdapter implements GeocodingPort {
  private readonly logger = new Logger(GoogleGeocodingAdapter.name);
  private readonly config: GeocodingConfig;

  constructor(configService: ConfigService) {
    this.config = configService.get<GeocodingConfig>("geocoding") ?? {
      driver: "google",
      apiKey: "",
      geocodeUrl: "https://maps.googleapis.com/maps/api/geocode/json",
    };
  }

  async geocodificar(direccion: string): Promise<GeocodingResultado> {
    if (!this.config.apiKey) {
      this.logger.error("[geocoding:google] falta GOOGLE_GEOCODING_API_KEY — no se puede geocodificar");
      return { encontrado: false, latitud: null, longitud: null };
    }

    const url = new URL(this.config.geocodeUrl);
    url.searchParams.set("address", direccion);
    url.searchParams.set("key", this.config.apiKey);

    let datos: RespuestaGeocodingGoogle;
    try {
      const respuesta = await fetch(url.toString());
      if (!respuesta.ok) {
        this.logger.warn(`[geocoding:google] HTTP ${respuesta.status} geocodificando "${direccion}"`);
        return { encontrado: false, latitud: null, longitud: null };
      }
      datos = (await respuesta.json()) as RespuestaGeocodingGoogle;
    } catch (error) {
      this.logger.warn(`[geocoding:google] error de red geocodificando "${direccion}": ${String(error)}`);
      return { encontrado: false, latitud: null, longitud: null };
    }

    if (datos.status !== "OK" || datos.results.length === 0) {
      return { encontrado: false, latitud: null, longitud: null };
    }
    const { lat, lng } = datos.results[0].geometry.location;
    return { encontrado: true, latitud: lat, longitud: lng };
  }
}
