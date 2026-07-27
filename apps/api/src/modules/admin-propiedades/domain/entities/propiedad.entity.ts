import type { EstadoPropiedad } from "../types/estado-propiedad";
import type { TipoOperacion } from "../types/tipo-operacion";
import type { RolActor } from "../types/rol-actor";
import { Precio } from "../value-objects/precio.vo";
import { Area } from "../value-objects/area.vo";
import { Slug } from "../value-objects/slug.vo";
import type { Coordenadas } from "../value-objects/coordenadas.vo";
import { esTransicionValida, requiereAdministrador } from "../rules/transiciones-estado";
import {
  ReaperturaSoloAdministradorError,
  TransicionEstadoInvalidaError,
} from "../errors/dominio-propiedades.errors";

/** Amenidad asociada a la propiedad: la fila existe = checkbox marcado; `cantidad` ≥ 1 (ADR-005). */
export interface PropiedadAmenidadItem {
  amenidadId: string;
  cantidad: number;
}

export interface PropiedadProps {
  id: string;
  codigo: string;
  titulo: string;
  slug: string;
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
  estado: EstadoPropiedad;
  destacada: boolean;
  archivada: boolean;
  agenteId: string | null;
  latitud: number | null;
  longitud: number | null;
  amenidades: PropiedadAmenidadItem[];
  publicadaEn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearPropiedadInput {
  id: string;
  codigo: string;
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
  ahora: Date;
}

export interface EditarPropiedadInput {
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
  /** Solo se aplica si `agenteId !== undefined` (el use-case decide según el rol — RN-016). */
  agenteId?: string | null;
  amenidades: PropiedadAmenidadItem[];
}

/**
 * Aggregate raíz Propiedad (ANALYZE-003, ERD DESIGN-026). Dueño de la escritura del catálogo de
 * inmuebles; shared kernel de solo lectura para los contextos de portal (DESIGN-027). Sin
 * dependencias de framework ni de infraestructura (regla de pureza de dominio, ADR-001).
 *
 * Invariantes de negocio encapsulados aquí: precio/área válidos (RN-017/RN-018), máquina de
 * estados (RN-012) y slug estable derivado del código (RN-007). Las fotos y la ubicación son
 * responsabilidad del contexto `admin-multimedia` (composición) y no viven en este aggregate.
 */
export class Propiedad {
  private constructor(private props: PropiedadProps) {}

  /** Reconstruye desde persistencia — no revalida invariantes de creación. */
  static reconstituir(props: PropiedadProps): Propiedad {
    return new Propiedad({ ...props, amenidades: [...props.amenidades] });
  }

  /** CU-001 (HU-001) — alta de una propiedad nueva. Arranca `disponible` y visible en el portal. */
  static crear(input: CrearPropiedadInput): Propiedad {
    const precio = Precio.crear(input.precio);
    const area = Area.crear(input.area);
    const slug = Slug.desdeTitulo(input.titulo, input.codigo);

    return new Propiedad({
      id: input.id,
      codigo: input.codigo,
      titulo: input.titulo,
      slug: slug.valor,
      descripcion: input.descripcion,
      tipoOperacion: input.tipoOperacion,
      tipoPropiedadId: input.tipoPropiedadId,
      ciudad: input.ciudad,
      barrio: input.barrio,
      direccion: input.direccion,
      precio: precio.valor,
      area: area.valor,
      habitaciones: input.habitaciones,
      banos: input.banos,
      estrato: input.estrato,
      parqueaderos: input.parqueaderos,
      estado: "disponible",
      destacada: input.destacada,
      archivada: false,
      agenteId: input.agenteId,
      latitud: null,
      longitud: null,
      amenidades: [...input.amenidades],
      // Estado inicial `disponible` ⇒ visible en el portal de inmediato (CU-001 postcondición).
      publicadaEn: input.ahora,
      createdAt: input.ahora,
      updatedAt: input.ahora,
    });
  }

  /** CU-002 — edición de datos. NO cambia el estado (eso va por `cambiarEstado`) ni el slug (RN-007, estable). */
  editarDatos(input: EditarPropiedadInput, ahora: Date): void {
    const precio = Precio.crear(input.precio);
    const area = Area.crear(input.area);

    this.props.titulo = input.titulo;
    this.props.descripcion = input.descripcion;
    this.props.tipoOperacion = input.tipoOperacion;
    this.props.tipoPropiedadId = input.tipoPropiedadId;
    this.props.ciudad = input.ciudad;
    this.props.barrio = input.barrio;
    this.props.direccion = input.direccion;
    this.props.precio = precio.valor;
    this.props.area = area.valor;
    this.props.habitaciones = input.habitaciones;
    this.props.banos = input.banos;
    this.props.estrato = input.estrato;
    this.props.parqueaderos = input.parqueaderos;
    this.props.destacada = input.destacada;
    if (input.agenteId !== undefined) {
      this.props.agenteId = input.agenteId;
    }
    this.props.amenidades = [...input.amenidades];
    this.tocar(ahora);
  }

  /**
   * CU-003 (HU-002) — aplica una transición de la máquina de estados (RN-012). Devuelve el estado
   * anterior para que el use-case registre la fila de historial (ADR-006) en la misma transacción.
   * Lanza `TransicionEstadoInvalidaError` (transición no permitida) o
   * `ReaperturaSoloAdministradorError` (reapertura reservada al Administrador).
   */
  cambiarEstado(nuevoEstado: EstadoPropiedad, actorRol: RolActor, ahora: Date): EstadoPropiedad {
    const anterior = this.props.estado;
    if (!esTransicionValida(anterior, nuevoEstado)) {
      throw new TransicionEstadoInvalidaError();
    }
    if (requiereAdministrador(anterior, nuevoEstado) && actorRol !== "administrador") {
      throw new ReaperturaSoloAdministradorError();
    }
    this.props.estado = nuevoEstado;
    this.tocar(ahora);
    return anterior;
  }

  /** RN-027 — marca la propiedad como inactiva (invisible en el portal). */
  archivar(ahora: Date): void {
    this.props.archivada = true;
    this.tocar(ahora);
  }

  /** RN-027 — restaura una propiedad archivada (vuelve a ser visible según su estado). */
  restaurar(ahora: Date): void {
    this.props.archivada = false;
    this.tocar(ahora);
  }

  /**
   * RN-033 — fija la ubicación de la propiedad. Recibe `Coordenadas` ya validadas (rango
   * geográfico, VO) — resueltas manualmente o por geocodificación de `direccion` (el modo y la
   * llamada al `GeocodingPort` los orquesta el caso de uso, nunca el aggregate).
   */
  establecerUbicacion(coordenadas: Coordenadas, ahora: Date): void {
    this.props.latitud = coordenadas.latitud;
    this.props.longitud = coordenadas.longitud;
    this.tocar(ahora);
  }

  /**
   * HU-003 (RN-026) — crea una copia como plantilla: mismos datos de texto, precio, tipo y
   * características (amenidades), pero SIN fotos, en estado `disponible` y con nuevo `codigo`/`slug`,
   * independientemente del estado del original. El `agenteId` de la copia lo decide el use-case.
   */
  duplicar(input: { nuevoId: string; nuevoCodigo: string; agenteId: string | null; ahora: Date }): Propiedad {
    return Propiedad.crear({
      id: input.nuevoId,
      codigo: input.nuevoCodigo,
      titulo: this.props.titulo,
      descripcion: this.props.descripcion,
      tipoOperacion: this.props.tipoOperacion,
      tipoPropiedadId: this.props.tipoPropiedadId,
      ciudad: this.props.ciudad,
      barrio: this.props.barrio,
      direccion: this.props.direccion,
      precio: this.props.precio,
      area: this.props.area,
      habitaciones: this.props.habitaciones,
      banos: this.props.banos,
      estrato: this.props.estrato,
      parqueaderos: this.props.parqueaderos,
      destacada: false,
      agenteId: input.agenteId,
      amenidades: this.props.amenidades.map((a) => ({ ...a })),
      ahora: input.ahora,
    });
  }

  private tocar(ahora: Date): void {
    this.props.updatedAt = ahora;
  }

  get id(): string {
    return this.props.id;
  }
  get codigo(): string {
    return this.props.codigo;
  }
  get slug(): string {
    return this.props.slug;
  }
  get estado(): EstadoPropiedad {
    return this.props.estado;
  }
  get archivada(): boolean {
    return this.props.archivada;
  }
  get agenteId(): string | null {
    return this.props.agenteId;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get direccion(): string | null {
    return this.props.direccion;
  }
  get latitud(): number | null {
    return this.props.latitud;
  }
  get longitud(): number | null {
    return this.props.longitud;
  }

  toProps(): Readonly<PropiedadProps> {
    return { ...this.props, amenidades: this.props.amenidades.map((a) => ({ ...a })) };
  }
}
