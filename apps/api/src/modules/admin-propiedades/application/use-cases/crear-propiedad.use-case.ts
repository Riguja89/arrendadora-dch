import { Inject, Injectable } from "@nestjs/common";
import { Propiedad, type PropiedadAmenidadItem } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import {
  AmenidadInvalidaError,
  TipoPropiedadInvalidoError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import {
  AMENIDAD_REPOSITORY,
  TIPO_PROPIEDAD_REPOSITORY,
  type CatalogoRepositoryPort,
} from "../../domain/ports/catalogo.repository.port";
import { GENERADOR_CODIGO, type GeneradorCodigoPort } from "../../domain/ports/generador-codigo.port";
import { ID_GENERATOR, type IdGeneratorPort } from "../../domain/ports/id-generator.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface CrearPropiedadInput {
  actor: Actor;
  titulo: string;
  descripcion: string;
  tipoOperacion: TipoOperacion;
  tipoPropiedadId: string;
  ciudad: string;
  barrio: string | null;
  direccion: string | null;
  precio: number;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  destacada: boolean;
  /** Solo Administrador/Editor pueden asignar otro agente (RN-011); el Agente queda como responsable. */
  agenteId: string | null;
  amenidades: PropiedadAmenidadItem[];
}

/**
 * CU-001 (HU-001) — Crear una propiedad nueva. Valida el tipo y las amenidades contra los
 * catálogos activos (ADR-005), resuelve el agente responsable según el rol (RN-010/RN-011),
 * genera el código legible secuencial (GAP-005) y persiste la propiedad en estado `disponible`.
 */
@Injectable()
export class CrearPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(TIPO_PROPIEDAD_REPOSITORY) private readonly tipos: CatalogoRepositoryPort,
    @Inject(AMENIDAD_REPOSITORY) private readonly amenidades: CatalogoRepositoryPort,
    @Inject(GENERADOR_CODIGO) private readonly generadorCodigo: GeneradorCodigoPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: CrearPropiedadInput): Promise<Propiedad> {
    const tipo = await this.tipos.buscarPorId(input.tipoPropiedadId);
    if (!tipo || !tipo.activo) {
      throw new TipoPropiedadInvalidoError();
    }

    await this.validarAmenidades(input.amenidades);

    const agenteId = input.actor.rol === "agente" ? input.actor.id : input.agenteId ?? null;

    const propiedad = Propiedad.crear({
      id: this.idGenerator.nuevo(),
      codigo: await this.generadorCodigo.siguiente(),
      titulo: input.titulo,
      descripcion: input.descripcion,
      tipoOperacion: input.tipoOperacion,
      tipoPropiedadId: input.tipoPropiedadId,
      ciudad: input.ciudad,
      barrio: input.barrio,
      direccion: input.direccion,
      precio: input.precio,
      area: input.area,
      habitaciones: input.habitaciones,
      banos: input.banos,
      estrato: input.estrato,
      parqueaderos: input.parqueaderos,
      destacada: input.destacada,
      agenteId,
      amenidades: input.amenidades,
      ahora: this.reloj.ahora(),
    });

    await this.propiedades.guardar(propiedad);
    return propiedad;
  }

  private async validarAmenidades(amenidades: PropiedadAmenidadItem[]): Promise<void> {
    if (amenidades.length === 0) {
      return;
    }
    const ids = amenidades.map((a) => a.amenidadId);
    if (!(await this.amenidades.existenActivos(ids))) {
      throw new AmenidadInvalidaError();
    }
  }
}
