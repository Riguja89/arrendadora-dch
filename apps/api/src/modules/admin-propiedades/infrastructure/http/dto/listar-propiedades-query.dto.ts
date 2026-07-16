import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { ESTADOS_PROPIEDAD_VALIDOS, type EstadoPropiedad } from "../../../domain/types/estado-propiedad";
import { TIPOS_OPERACION_VALIDOS, type TipoOperacion } from "../../../domain/types/tipo-operacion";

/** GET /admin/propiedades — query params (contrato DESIGN-028, paginación ADR-015). */
export class ListarPropiedadesQueryDto {
  @IsOptional()
  @IsIn(ESTADOS_PROPIEDAD_VALIDOS, { message: "El estado seleccionado no es válido." })
  estado?: EstadoPropiedad;

  @IsOptional()
  @IsIn(TIPOS_OPERACION_VALIDOS, { message: "El tipo de operación no es válido." })
  tipo_operacion?: TipoOperacion;

  @IsOptional()
  @IsUUID("all", { message: "El tipo de propiedad seleccionado no es válido." })
  tipo_propiedad?: string;

  @IsOptional()
  @IsString({ message: "El filtro de agente no es válido." })
  agente?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  archivada?: boolean;

  @IsOptional()
  @IsString({ message: "El término de búsqueda no es válido." })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero." })
  @Min(1, { message: "La página debe ser mayor o igual a 1." })
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño de página debe ser un número entero." })
  @Min(1, { message: "El tamaño de página debe ser mayor o igual a 1." })
  @Max(100, { message: "El tamaño de página no puede ser mayor a 100." })
  tamano_pagina: number = 20;
}
