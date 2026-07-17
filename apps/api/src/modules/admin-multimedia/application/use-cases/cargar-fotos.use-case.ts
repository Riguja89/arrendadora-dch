import { Inject, Injectable } from "@nestjs/common";
import type { Actor } from "../../domain/types/rol-actor";
import type { Foto } from "../../domain/entities/foto.entity";
import type { FotoSubida } from "../../domain/entities/galeria-fotos.entity";
import { GaleriaFotos } from "../../domain/entities/galeria-fotos.entity";
import { puedeGestionarMultimedia } from "../../domain/rules/acceso-multimedia";
import { validarArchivoImagen } from "../../domain/rules/validar-archivo-imagen";
import { MAX_FOTOS_POR_PROPIEDAD } from "../../domain/rules/multimedia-constantes";
import {
  MaximoFotosExcedidoError,
  PropiedadNoEncontradaError,
  SinPermisoMultimediaError,
} from "../../domain/errors/dominio-multimedia.errors";
import { FOTO_REPOSITORY, type FotoRepositoryPort } from "../../domain/ports/foto.repository.port";
import {
  ALMACENAMIENTO_OBJETOS,
  type AlmacenamientoObjetosPort,
} from "../../domain/ports/almacenamiento-objetos.port";
import {
  OPTIMIZADOR_IMAGENES,
  type OptimizadorImagenesPort,
} from "../../domain/ports/optimizador-imagenes.port";
import { PROPIEDAD_ACCESO, type PropiedadAccesoPort } from "../../domain/ports/propiedad-acceso.port";
import { ID_GENERATOR, type IdGeneratorPort } from "../../domain/ports/id-generator.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

/** Un archivo de imagen recibido por multipart, con sus bytes en memoria. */
export interface ArchivoParaCargar {
  nombre: string;
  mime: string;
  tamanoBytes: number;
  datos: Buffer;
}

export interface FotoRechazada {
  nombreArchivo: string;
  motivo: string;
}

export interface CargarFotosResultado {
  cargadas: Foto[];
  rechazadas: FotoRechazada[];
}

/**
 * CU-001 (HU-001) — carga múltiple de fotos a una propiedad. Valida cada archivo por separado
 * (RN-028/029/030): los inválidos se reportan sin cancelar a los válidos. Cada foto válida se
 * optimiza (RN-006) y sus variantes se suben al almacenamiento (ADR-008) antes de registrar los
 * metadatos. Excedería el máximo de 10 → 409 sin subir nada. La primera foto de una galería vacía
 * queda como portada (RN-014).
 */
@Injectable()
export class CargarFotosUseCase {
  constructor(
    @Inject(PROPIEDAD_ACCESO) private readonly propiedades: PropiedadAccesoPort,
    @Inject(FOTO_REPOSITORY) private readonly fotos: FotoRepositoryPort,
    @Inject(ALMACENAMIENTO_OBJETOS) private readonly almacenamiento: AlmacenamientoObjetosPort,
    @Inject(OPTIMIZADOR_IMAGENES) private readonly optimizador: OptimizadorImagenesPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: {
    actor: Actor;
    propiedadId: string;
    archivos: ArchivoParaCargar[];
  }): Promise<CargarFotosResultado> {
    const acceso = await this.propiedades.obtener(input.propiedadId);
    if (!acceso) {
      throw new PropiedadNoEncontradaError();
    }
    if (!puedeGestionarMultimedia(input.actor, acceso.agenteId)) {
      throw new SinPermisoMultimediaError();
    }

    const rechazadas: FotoRechazada[] = [];
    const validos: { archivo: ArchivoParaCargar; formato: ReturnType<typeof validarArchivoImagen> }[] = [];
    for (const archivo of input.archivos) {
      const resultado = validarArchivoImagen(archivo);
      if (resultado.valido) {
        validos.push({ archivo, formato: resultado });
      } else {
        rechazadas.push({ nombreArchivo: archivo.nombre, motivo: resultado.motivo });
      }
    }

    const galeria = GaleriaFotos.reconstituir(
      input.propiedadId,
      await this.fotos.listarPorPropiedad(input.propiedadId),
    );

    if (validos.length === 0) {
      return { cargadas: [], rechazadas };
    }
    // Rechaza el lote completo antes de subir binarios si excedería el tope (ADR-008, evita huérfanos en S3).
    if (galeria.fotos().length + validos.length > MAX_FOTOS_POR_PROPIEDAD) {
      throw new MaximoFotosExcedidoError();
    }

    const ahora = this.reloj.ahora();
    const subidas: FotoSubida[] = [];
    for (const { archivo, formato } of validos) {
      if (!formato.valido) continue; // narrowing — siempre válido en esta rama
      const id = this.idGenerator.nuevo();
      const s3KeyBase = `propiedades/${input.propiedadId}/${id}`;
      const variantes = await this.optimizador.optimizar({ datos: archivo.datos, formato: formato.formato });
      await this.almacenamiento.subirVariantes(s3KeyBase, variantes);
      subidas.push({ id, s3KeyBase, formatoOriginal: formato.formato });
    }

    const cargadas = galeria.agregar(subidas, ahora);
    await this.fotos.sincronizar({
      propiedadId: input.propiedadId,
      fotos: [...galeria.fotos()],
      idsEliminadas: [],
    });

    return { cargadas, rechazadas };
  }
}
