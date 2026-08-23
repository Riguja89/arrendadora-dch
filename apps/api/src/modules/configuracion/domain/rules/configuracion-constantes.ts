/**
 * Constantes del bounded context de soporte `configuracion` (ADR-016, ADR-012).
 *
 * `CONFIGURACION_SINGLETON_ID` — id fijo y bien conocido de la ÚNICA fila del aggregate
 * `ConfiguracionSistema`. Garantía de singleton a nivel de aplicación (el schema Prisma no
 * expresa "máximo 1 fila" de forma declarativa, ver TODO en `schema.prisma`): todo acceso pasa por
 * este id constante, de modo que el `upsert` nunca puede crear una segunda fila. Complementa el
 * patrón get-or-create de `ObtenerConfiguracionUseCase`.
 */
export const CONFIGURACION_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Valores por defecto (semilla) de la configuración. Se usan una única vez, cuando aún no existe
 * la fila singleton (get-or-create). Son marcadores válidos —cumplen los invariantes del dominio—
 * que el Administrador reemplaza desde el panel (`PUT /admin/configuracion`, GAP-002). No son
 * reglas de negocio: son el estado inicial mínimo para que la lectura pública nunca falle.
 */
export const CONFIGURACION_DEFECTO = {
  whatsappNumeroCentral: "+57 300 000 0000",
  whatsappPlantillaMensaje: "Hola, estoy interesado en la propiedad {codigo}.",
  nombreInmobiliaria: "Arrendadora",
  imagenGenericaUrl: "https://arrendadora.local/imagen-generica.png",
} as const;
