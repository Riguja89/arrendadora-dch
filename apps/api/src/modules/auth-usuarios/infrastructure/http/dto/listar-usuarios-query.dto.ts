import { Expose, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { ROLES_VALIDOS, type Rol } from "../../../domain/types/rol";

const ESTADOS_VALIDOS = ["activo", "desactivado", "bloqueado"] as const;
type EstadoUsuarioQuery = (typeof ESTADOS_VALIDOS)[number];

/** GET /admin/usuarios — query params (contrato DESIGN-028, paginación ADR-015). */
export class ListarUsuariosQueryDto {
  @IsOptional()
  @IsIn(ESTADOS_VALIDOS, { message: "El estado seleccionado no es válido." })
  estado?: EstadoUsuarioQuery;

  @IsOptional()
  @IsIn(ROLES_VALIDOS, { message: "El rol seleccionado no es válido." })
  rol?: Rol;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero." })
  @Min(1, { message: "La página debe ser mayor o igual a 1." })
  pagina: number = 1;

  @Expose({ name: "tamano_pagina" })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño de página debe ser un número entero." })
  @Min(1, { message: "El tamaño de página debe ser mayor o igual a 1." })
  @Max(100, { message: "El tamaño de página no puede ser mayor a 100." })
  tamanoPagina: number = 20;
}
