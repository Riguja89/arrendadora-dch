import type { Usuario as UsuarioWire, SesionUsuario as SesionUsuarioWire } from "@arrendadora/shared";
import { construirMetaPaginacion, type MetaPaginacion } from "@arrendadora/shared";
import type { Usuario } from "../../../domain/entities/usuario.entity";

/** Mapea el aggregate de dominio al shape exacto del contrato (`Usuario`, DESIGN-028). Nunca expone `passwordHash`. */
export function aUsuarioWire(usuario: Usuario): UsuarioWire {
  const props = usuario.toProps();
  return {
    id: props.id,
    nombre: props.nombre,
    email: props.email,
    rol: props.rol,
    estado: props.estado,
    whatsapp: props.whatsapp,
    requiere_cambio_password: props.requiereCambioPassword,
    created_at: props.createdAt.toISOString(),
    updated_at: props.updatedAt.toISOString(),
  };
}

/** POST /auth/login — respuesta `SesionUsuario`. */
export function aSesionUsuarioWire(usuario: Usuario): SesionUsuarioWire {
  return {
    usuario: aUsuarioWire(usuario),
    requiere_cambio_password: usuario.requiereCambioPassword,
  };
}

/** Wire shape de paginación (ADR-015): `pagina`, `tamano_pagina`, `total`, `total_paginas`. */
export interface PaginacionMetaWire {
  pagina: number;
  tamano_pagina: number;
  total: number;
  total_paginas: number;
}

export function aPaginacionWire(total: number, pagina: number, tamanoPagina: number): PaginacionMetaWire {
  const meta: MetaPaginacion = construirMetaPaginacion(total, { pagina, tamanoPagina });
  return {
    pagina: meta.pagina,
    tamano_pagina: meta.tamanoPagina,
    total: meta.total,
    total_paginas: meta.totalPaginas,
  };
}
