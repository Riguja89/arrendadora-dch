import { Inject, Injectable } from "@nestjs/common";
import type { Propiedad } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import { resolverModoUbicacion } from "../../domain/rules/modo-ubicacion";
import { Coordenadas } from "../../domain/value-objects/coordenadas.vo";
import {
  DireccionNoGeocodificableError,
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import { GEOCODING, type GeocodingPort } from "../../domain/ports/geocoding.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface EstablecerUbicacionInput {
  actor: Actor;
  id: string;
  latitud?: number | null;
  longitud?: number | null;
  geocodificarDireccion?: boolean;
}

/**
 * RN-033 (ADR-011) — fija la ubicación de una propiedad: (a) manualmente (`latitud`+`longitud`,
 * pin arrastrable en el panel) o (b) geocodificando `direccion` a través del `GeocodingPort`.
 * `resolverModoUbicacion` decide el modo (o rechaza con 422 si llegan ambos o ninguno — dominio
 * puro, sin I/O); este caso de uso es el único punto que orquesta el I/O hacia el proveedor de
 * geocoding. Restringido a Administrador/Editor en el controller (RBAC, ADR-014, contrato
 * DESIGN-028) — a diferencia de otros endpoints del módulo, el Agente NO tiene acceso aquí ni
 * siquiera sobre sus propias propiedades.
 */
@Injectable()
export class EstablecerUbicacionPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(GEOCODING) private readonly geocoding: GeocodingPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: EstablecerUbicacionInput): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }

    const modo = resolverModoUbicacion({
      latitud: input.latitud,
      longitud: input.longitud,
      geocodificarDireccion: input.geocodificarDireccion,
    });

    const coordenadas =
      modo === "manual"
        ? Coordenadas.crear(input.latitud as number, input.longitud as number)
        : await this.geocodificarDireccionDeLaPropiedad(propiedad);

    propiedad.establecerUbicacion(coordenadas, this.reloj.ahora());
    await this.propiedades.guardar(propiedad);
    return propiedad;
  }

  private async geocodificarDireccionDeLaPropiedad(propiedad: Propiedad): Promise<Coordenadas> {
    if (!propiedad.direccion) {
      throw new DireccionNoGeocodificableError();
    }
    const resultado = await this.geocoding.geocodificar(propiedad.direccion);
    if (!resultado.encontrado || resultado.latitud === null || resultado.longitud === null) {
      throw new DireccionNoGeocodificableError();
    }
    return Coordenadas.crear(resultado.latitud, resultado.longitud);
  }
}
