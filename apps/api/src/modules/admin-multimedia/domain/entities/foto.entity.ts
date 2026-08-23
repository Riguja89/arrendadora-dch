import type { FormatoImagen } from "../value-objects/formato-imagen.vo";

export interface FotoProps {
  id: string;
  propiedadId: string;
  /** Posición 1..N dentro de la galería (contigua, sin huecos — invariante de `GaleriaFotos`). */
  orden: number;
  esPortada: boolean;
  /**
   * Prefijo de clave en el almacenamiento de objetos (`propiedades/{propiedadId}/{fotoId}`, ADR-008).
   * Las variantes concretas se resuelven como `{s3KeyBase}/{variante}.webp` en el adaptador.
   */
  s3KeyBase: string;
  formatoOriginal: FormatoImagen;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Foto de una propiedad. Es una entidad **interna** del aggregate `GaleriaFotos` — su `orden` y
 * `esPortada` solo se mutan a través de la galería, que mantiene las invariantes de conjunto
 * (portada única, orden contiguo). Sin dependencias de framework/infra (pureza de dominio, ADR-001).
 */
export class Foto {
  private constructor(private props: FotoProps) {}

  /** Reconstruye desde persistencia — no revalida invariantes de conjunto (las valida la galería). */
  static reconstituir(props: FotoProps): Foto {
    return new Foto({ ...props });
  }

  /** Crea una foto ya subida al almacenamiento; la galería le asigna `orden`/`esPortada` al agregarla. */
  static crear(props: {
    id: string;
    propiedadId: string;
    s3KeyBase: string;
    formatoOriginal: FormatoImagen;
    ahora: Date;
  }): Foto {
    return new Foto({
      id: props.id,
      propiedadId: props.propiedadId,
      orden: 0,
      esPortada: false,
      s3KeyBase: props.s3KeyBase,
      formatoOriginal: props.formatoOriginal,
      createdAt: props.ahora,
      updatedAt: props.ahora,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get propiedadId(): string {
    return this.props.propiedadId;
  }
  get orden(): number {
    return this.props.orden;
  }
  get esPortada(): boolean {
    return this.props.esPortada;
  }
  get s3KeyBase(): string {
    return this.props.s3KeyBase;
  }
  get formatoOriginal(): FormatoImagen {
    return this.props.formatoOriginal;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Mutación controlada por `GaleriaFotos`: fija posición y portada, tocando `updatedAt` si cambió. */
  aplicarPosicion(orden: number, esPortada: boolean, ahora: Date): void {
    if (this.props.orden === orden && this.props.esPortada === esPortada) {
      return;
    }
    this.props.orden = orden;
    this.props.esPortada = esPortada;
    this.props.updatedAt = ahora;
  }

  toProps(): Readonly<FotoProps> {
    return { ...this.props };
  }
}
