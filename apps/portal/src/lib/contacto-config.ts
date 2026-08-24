/**
 * Configuración institucional de la landing `/nosotros` (BUILD-043).
 *
 * SSoT de todos los datos de contacto, textos institucionales y enlaces de la
 * landing. Centralizado aquí para que reemplazar los placeholders por datos
 * reales del cliente sea trivial (un solo archivo). Ver GAP-L01/GAP-L02.
 *
 * TODO(cliente): TODO valor marcado abajo con `// TODO(cliente)` es un
 * placeholder de ejemplo. Reemplazar por el dato real antes de producción.
 *
 * Las funciones `construir*` son lógica pura (sin React ni DOM) — se prueban en
 * Vitest (`environment: node`), igual que `catalogo-filtros.ts`.
 */

/** Datos de contacto directo (RN-L02: solo enlaces, sin backend). */
export interface DatosContacto {
  /** Solo dígitos, sin indicativo de país ni símbolos. Ej. "3001234567". */
  whatsappNumero: string;
  /** Solo dígitos, sin indicativo. Puede ser fijo o celular. */
  telefonoNumero: string;
  /** Etiqueta visible del teléfono, ya formateada para lectura humana. */
  telefonoEtiqueta: string;
  email: string;
  instagramUsuario: string;
  facebookPagina: string;
  direccion: string;
}

/**
 * Datos de contacto de D-CH Inmobiliaria.
 * TODO(cliente): reemplazar por los datos reales confirmados con el cliente.
 */
export const DATOS_CONTACTO: DatosContacto = {
  whatsappNumero: "3001234567", // TODO(cliente): reemplazar por número real de WhatsApp
  telefonoNumero: "6081234567", // TODO(cliente): reemplazar por teléfono real
  telefonoEtiqueta: "+57 3XX XXX XXXX", // TODO(cliente): reemplazar por etiqueta real
  email: "info@dch-inmobiliaria.com", // TODO(cliente): reemplazar por email real
  instagramUsuario: "dch.inmobiliaria", // TODO(cliente): reemplazar por usuario real de Instagram
  facebookPagina: "dch.inmobiliaria", // TODO(cliente): reemplazar por página real de Facebook
  direccion: "Yopal, Casanare, Colombia", // TODO(cliente): reemplazar por dirección real
};

/** Nombre y descriptor de marca, usados en header, hero y footer. */
export const MARCA = {
  nombre: "D-CH Inmobiliaria",
  descriptor: "Servicios inmobiliarios en Yopal y Aguazul",
} as const;

/**
 * Mensaje prellenado del deep link de WhatsApp desde la landing (spec §Bloque de
 * contacto). TODO(cliente): ajustar tono si el cliente lo prefiere distinto.
 */
export const MENSAJE_WHATSAPP_LANDING =
  "Hola, vi la página web de D-CH Inmobiliaria y me gustaría obtener más información sobre sus servicios inmobiliarios.";

/**
 * Texto institucional de la sección "Sobre nosotros".
 * TODO(cliente): reemplazar por el texto real y la trayectoria confirmada.
 */
export const TEXTO_SOBRE_NOSOTROS: readonly string[] = [
  "En D-CH Inmobiliaria nos dedicamos a acompañar a familias y empresarios en la búsqueda del inmueble ideal en el corazón de Casanare.",
  "Con años de experiencia en el mercado de Yopal y Aguazul, conocemos cada barrio y cada oportunidad. Nuestro compromiso es hacer que comprar, vender o arrendar sea un proceso claro, humano y sin sorpresas.",
];

/** Un servicio de la sección "Nuestros servicios". */
export interface Servicio {
  id: string;
  titulo: string;
  descripcion: string;
}

/** Cuatro servicios de la inmobiliaria (HU-L01 escenario 4). */
export const SERVICIOS: readonly Servicio[] = [
  {
    id: "compra",
    titulo: "Compra",
    descripcion:
      "Te ayudamos a encontrar tu hogar o local ideal en Casanare, con acompañamiento en cada paso.",
  },
  {
    id: "venta",
    titulo: "Venta",
    descripcion:
      "Vendemos tu inmueble al mejor precio del mercado, con una estrategia clara y transparente.",
  },
  {
    id: "arriendo",
    titulo: "Arriendo",
    descripcion:
      "Encuentra el lugar ideal para vivir o trabajar, o pon en arriendo tu propiedad con confianza.",
  },
  {
    id: "avaluos",
    titulo: "Avalúos",
    descripcion:
      "Conoce el valor real de tu propiedad con un avalúo profesional y ajustado al mercado local.",
  },
];

/** Un diferencial de la sección "Por qué elegirnos". */
export interface Diferencial {
  id: string;
  titulo: string;
  descripcion: string;
}

/** Cuatro diferenciales (wireframe §3.5). */
export const DIFERENCIALES: readonly Diferencial[] = [
  {
    id: "local",
    titulo: "Conocimiento local profundo",
    descripcion:
      "Conocemos cada barrio de Yopal y Aguazul. Sabemos dónde están las mejores oportunidades.",
  },
  {
    id: "personalizada",
    titulo: "Atención personalizada",
    descripcion:
      "Cada cliente recibe un agente dedicado que lo acompaña en todo el proceso.",
  },
  {
    id: "transparencia",
    titulo: "Transparencia total",
    descripcion:
      "Sin costos ocultos. Te explicamos cada paso y cada documento con claridad.",
  },
  {
    id: "portafolio",
    titulo: "Portafolio diverso",
    descripcion:
      "Apartamentos, casas, locales, oficinas, lotes y más, en arriendo y venta.",
  },
];

/**
 * Construye el deep link de WhatsApp con el indicativo de Colombia (57) y el
 * mensaje prellenado codificado (RN-L02). Formato: `https://wa.me/57{num}?text=…`.
 */
export function construirEnlaceWhatsapp(
  numero: string = DATOS_CONTACTO.whatsappNumero,
  mensaje: string = MENSAJE_WHATSAPP_LANDING,
): string {
  const soloDigitos = numero.replace(/\D/g, "");
  const texto = encodeURIComponent(mensaje);
  return `https://wa.me/57${soloDigitos}?text=${texto}`;
}

/** Construye el enlace telefónico `tel:+57{numero}` (solo dígitos). */
export function construirEnlaceTelefono(
  numero: string = DATOS_CONTACTO.telefonoNumero,
): string {
  const soloDigitos = numero.replace(/\D/g, "");
  return `tel:+57${soloDigitos}`;
}

/** Construye el enlace `mailto:{email}`. */
export function construirEnlaceEmail(
  email: string = DATOS_CONTACTO.email,
): string {
  return `mailto:${email}`;
}

/** URL pública del perfil de Instagram. */
export function construirEnlaceInstagram(
  usuario: string = DATOS_CONTACTO.instagramUsuario,
): string {
  return `https://instagram.com/${usuario}`;
}

/** URL pública de la página de Facebook. */
export function construirEnlaceFacebook(
  pagina: string = DATOS_CONTACTO.facebookPagina,
): string {
  return `https://facebook.com/${pagina}`;
}
