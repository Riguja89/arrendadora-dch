import { Inject, Injectable } from "@nestjs/common";
import { Propiedad, type PropiedadAmenidadItem } from "../../domain/entities/propiedad.entity";
import type { Actor } from "../../domain/types/rol-actor";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import { puedeOperarSobrePropiedad } from "../../domain/rules/acceso-propiedad";
import {
  AmenidadInvalidaError,
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
  TipoPropiedadInvalidoError,
} from "../../domain/errors/dominio-propiedades.errors";
import { PROPIEDAD_REPOSITORY, type PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import {
  AMENIDAD_REPOSITORY,
  TIPO_PROPIEDAD_REPOSITORY,
  type CatalogoRepositoryPort,
} from "../../domain/ports/catalogo.repository.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface EditarPropiedadInput {
  actor: Actor;
  id: string;
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
  agenteId: string | null;
  amenidades: PropiedadAmenidadItem[];
}

/**
 * CU-002 — Editar una propiedad existente. Alcance por rol (RN-010/RN-011): el Agente solo edita
 * las propias; Administrador/Editor cualquiera. La reasignación de agente (RN-016) queda
 * reservada al Administrador — para Agente/Editor el `agente_id` recibido se ignora. No cambia
 * el estado (eso va por `PATCH .../estado`).
 */
@Injectable()
export class EditarPropiedadUseCase {
  constructor(
    @Inject(PROPIEDAD_REPOSITORY) private readonly propiedades: PropiedadRepositoryPort,
    @Inject(TIPO_PROPIEDAD_REPOSITORY) private readonly tipos: CatalogoRepositoryPort,
    @Inject(AMENIDAD_REPOSITORY) private readonly amenidades: CatalogoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: EditarPropiedadInput): Promise<Propiedad> {
    const propiedad = await this.propiedades.buscarPorId(input.id);
    if (!propiedad) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeOperarSobrePropiedad(input.actor, propiedad.agenteId)) {
      throw new SinPermisoPropiedadError();
    }

    const tipo = await this.tipos.buscarPorId(input.tipoPropiedadId);
    if (!tipo || !tipo.activo) {
      throw new TipoPropiedadInvalidoError();
    }
    await this.validarAmenidades(input.amenidades);

    // RN-016 — solo el Administrador reasigna el agente responsable; los demás roles no lo tocan.
    const agenteId = input.actor.rol === "administrador" ? input.agenteId : undefined;

    propiedad.editarDatos(
      {
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
      },
      this.reloj.ahora(),
    );

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
