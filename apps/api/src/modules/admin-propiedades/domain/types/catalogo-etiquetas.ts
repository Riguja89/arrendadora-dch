/**
 * Etiquetas de mensajes por catálogo. Se redactan con la concordancia de género correcta (ES,
 * zero-tolerancia): `tipo de propiedad` es masculino, `amenidad` es femenino. Las usan los casos
 * de uso genéricos de catálogo para construir los mensajes de error de dominio.
 */
export interface EtiquetasCatalogo {
  noEncontrado: string;
  duplicado: string;
}

export const ETIQUETAS_TIPO_PROPIEDAD: EtiquetasCatalogo = {
  noEncontrado: "El tipo de propiedad solicitado no existe.",
  duplicado: "Ya existe un tipo de propiedad con ese nombre.",
};

export const ETIQUETAS_AMENIDAD: EtiquetasCatalogo = {
  noEncontrado: "La amenidad solicitada no existe.",
  duplicado: "Ya existe una amenidad con ese nombre.",
};
