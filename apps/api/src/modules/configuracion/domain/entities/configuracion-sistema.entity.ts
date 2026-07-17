import { NumeroWhatsapp } from "../value-objects/numero-whatsapp.vo";
import { PlantillaMensaje } from "../value-objects/plantilla-mensaje.vo";
import {
  ImagenGenericaUrlInvalidaError,
  NombreInmobiliariaInvalidoError,
} from "../errors/dominio-configuracion.errors";
import { CONFIGURACION_DEFECTO } from "../rules/configuracion-constantes";

export interface ConfiguracionSistemaProps {
  id: string;
  whatsappNumeroCentral: string;
  whatsappPlantillaMensaje: string;
  nombreInmobiliaria: string;
  imagenGenericaUrl: string;
  actualizadaPor: string | null;
  updatedAt: Date;
}

/** Campos editables por el Administrador (`ConfiguracionSistemaEditar`, DESIGN-028). */
export interface ActualizarConfiguracionData {
  whatsappNumeroCentral: string;
  whatsappPlantillaMensaje: string;
  nombreInmobiliaria: string;
  imagenGenericaUrl: string;
  actualizadaPor: string | null;
}

/**
 * Aggregate raíz singleton `ConfiguracionSistema` (ADR-016, ADR-012). Contexto de soporte: existe
 * una única fila (ver `CONFIGURACION_SINGLETON_ID`). Sin dependencias de framework ni de
 * infraestructura (pureza de dominio, ADR-001) — Prisma/Nest quedan detrás de puertos y mappers.
 *
 * Invariantes (validados vía VOs y checks internos): número de WhatsApp con formato colombiano,
 * plantilla que solo admite el marcador `{codigo}`, nombre de inmobiliaria no vacío e imagen
 * genérica con URL http(s) válida. `actualizadaPor`/`updatedAt` los fija el backend, no el cliente.
 */
export class ConfiguracionSistema {
  private constructor(private props: ConfiguracionSistemaProps) {}

  /** Reconstruye una instancia desde persistencia — no revalida invariantes. */
  static reconstituir(props: ConfiguracionSistemaProps): ConfiguracionSistema {
    return new ConfiguracionSistema({ ...props });
  }

  /**
   * Semilla del singleton (get-or-create): estado inicial válido cuando aún no existe la fila.
   * Los valores por defecto son marcadores que el Administrador reemplaza desde el panel (GAP-002).
   */
  static crearPorDefecto(input: { id: string; ahora: Date }): ConfiguracionSistema {
    const config = new ConfiguracionSistema({
      id: input.id,
      whatsappNumeroCentral: CONFIGURACION_DEFECTO.whatsappNumeroCentral,
      whatsappPlantillaMensaje: CONFIGURACION_DEFECTO.whatsappPlantillaMensaje,
      nombreInmobiliaria: CONFIGURACION_DEFECTO.nombreInmobiliaria,
      imagenGenericaUrl: CONFIGURACION_DEFECTO.imagenGenericaUrl,
      actualizadaPor: null,
      updatedAt: input.ahora,
    });
    // Pasa por la misma validación que una actualización real: los defaults DEBEN ser válidos.
    config.aplicar({ ...CONFIGURACION_DEFECTO, actualizadaPor: null }, input.ahora);
    return config;
  }

  /** CU — Actualizar configuración: valida y persiste los campos editables (`PUT /admin/configuracion`). */
  actualizar(data: ActualizarConfiguracionData, ahora: Date): void {
    this.aplicar(data, ahora);
  }

  private aplicar(data: ActualizarConfiguracionData, ahora: Date): void {
    const numero = NumeroWhatsapp.crear(data.whatsappNumeroCentral);
    const plantilla = PlantillaMensaje.crear(data.whatsappPlantillaMensaje);
    const nombre = (data.nombreInmobiliaria ?? "").trim();
    if (nombre.length === 0) {
      throw new NombreInmobiliariaInvalidoError();
    }
    const imagenUrl = ConfiguracionSistema.normalizarUrl(data.imagenGenericaUrl);

    this.props.whatsappNumeroCentral = numero.valor;
    this.props.whatsappPlantillaMensaje = plantilla.valor;
    this.props.nombreInmobiliaria = nombre;
    this.props.imagenGenericaUrl = imagenUrl;
    this.props.actualizadaPor = data.actualizadaPor;
    this.props.updatedAt = ahora;
  }

  private static normalizarUrl(input: string): string {
    const valor = (input ?? "").trim();
    let url: URL;
    try {
      url = new URL(valor);
    } catch {
      throw new ImagenGenericaUrlInvalidaError();
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new ImagenGenericaUrlInvalidaError();
    }
    return valor;
  }

  get id(): string {
    return this.props.id;
  }
  get whatsappNumeroCentral(): string {
    return this.props.whatsappNumeroCentral;
  }
  get whatsappPlantillaMensaje(): string {
    return this.props.whatsappPlantillaMensaje;
  }
  get nombreInmobiliaria(): string {
    return this.props.nombreInmobiliaria;
  }
  get imagenGenericaUrl(): string {
    return this.props.imagenGenericaUrl;
  }
  get actualizadaPor(): string | null {
    return this.props.actualizadaPor;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toProps(): Readonly<ConfiguracionSistemaProps> {
    return { ...this.props };
  }
}
