/**
 * Construcción del deep link de contacto por WhatsApp (ADR-012, RN-004). Regla de dominio pura —
 * sin dependencias de framework ni de infraestructura.
 *
 * El deep link tiene la forma `https://wa.me/{numero}?text={mensaje}`, donde:
 * - `{numero}` es el número central de la inmobiliaria (ADR-012 Modelo B) reducido a solo dígitos
 *   (wa.me no admite `+`, espacios ni separadores).
 * - `{mensaje}` resulta de interpolar la plantilla configurable con el `{codigo}` de la propiedad
 *   (GAP-002) y luego URL-encodearlo.
 */

/** Marcador único admitido en la plantilla del mensaje (GAP-002, coherente con `PlantillaMensaje`). */
const MARCADOR_CODIGO = "{codigo}";

/**
 * Interpola la plantilla con el código de la propiedad. Si la plantilla no contiene `{codigo}`, el
 * mensaje se antepone con el código para que el receptor siempre pueda enrutar la consulta
 * (fallback de RN-004). No inventa texto adicional.
 */
export function resolverMensajeWhatsapp(plantilla: string, codigo: string): string {
  if (plantilla.includes(MARCADOR_CODIGO)) {
    return plantilla.split(MARCADOR_CODIGO).join(codigo);
  }
  return `${plantilla} ${codigo}`.trim();
}

/**
 * Normaliza un número de teléfono a solo dígitos para `wa.me` (elimina `+`, espacios y separadores).
 */
export function normalizarNumeroWhatsapp(numero: string): string {
  return numero.replace(/\D+/g, "");
}

/**
 * Arma el deep link `wa.me` completo (ADR-012, RN-004): número normalizado + mensaje interpolado y
 * URL-encodeado.
 */
export function construirDeepLinkWhatsapp(
  numeroCentral: string,
  plantillaMensaje: string,
  codigo: string,
): string {
  const numero = normalizarNumeroWhatsapp(numeroCentral);
  const mensaje = resolverMensajeWhatsapp(plantillaMensaje, codigo);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
