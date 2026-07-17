import type { ConfiguracionSistema } from "../../../domain/entities/configuracion-sistema.entity";

/**
 * Shape exacto del contrato (`ConfiguracionSistema`, DESIGN-028) en snake_case. Se define local al
 * mapper —como `PaginacionMetaWire` en `auth-usuarios`— para no depender de `@arrendadora/shared`,
 * que aún no exporta este tipo; si el portal luego lo necesita, se promueve a `packages/shared`.
 */
export interface ConfiguracionSistemaWire {
  whatsapp_numero_central: string;
  whatsapp_plantilla_mensaje: string;
  nombre_inmobiliaria: string;
  imagen_generica_url: string;
  actualizada_por: string | null;
  updated_at: string;
}

/** Mapea el aggregate de dominio al shape exacto del contrato admin (DESIGN-028). */
export function aConfiguracionWire(configuracion: ConfiguracionSistema): ConfiguracionSistemaWire {
  const props = configuracion.toProps();
  return {
    whatsapp_numero_central: props.whatsappNumeroCentral,
    whatsapp_plantilla_mensaje: props.whatsappPlantillaMensaje,
    nombre_inmobiliaria: props.nombreInmobiliaria,
    imagen_generica_url: props.imagenGenericaUrl,
    actualizada_por: props.actualizadaPor,
    updated_at: props.updatedAt.toISOString(),
  };
}
