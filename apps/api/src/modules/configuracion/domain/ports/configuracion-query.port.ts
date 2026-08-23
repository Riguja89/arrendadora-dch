export const CONFIGURACION_QUERY = Symbol("ConfiguracionQueryPort");

/**
 * Proyección de solo lectura de la configuración, SIN campos de auditoría (`actualizada_por`,
 * `updated_at`). Es el shape que otros bounded contexts —el Portal Detalle/Contacto— consumen
 * in-process para construir el deep link de WhatsApp y los metadatos Open Graph (ADR-016, patrón
 * Conformist del context map DESIGN-027).
 */
export interface ConfiguracionPublica {
  whatsappNumeroCentral: string;
  whatsappPlantillaMensaje: string;
  nombreInmobiliaria: string;
  imagenGenericaUrl: string;
}

/**
 * Puerto de consulta de solo lectura del singleton, expuesto por el módulo `configuracion` a los
 * consumidores downstream (ADR-016). Evita que el portal pegue al endpoint admin (RBAC
 * Administrador) o acceda al repositorio de otro contexto (regla in-process, DESIGN-027). Siempre
 * devuelve una configuración (get-or-create) — nunca `null`.
 */
export interface ConfiguracionQueryPort {
  obtenerConfiguracionPublica(): Promise<ConfiguracionPublica>;
}
