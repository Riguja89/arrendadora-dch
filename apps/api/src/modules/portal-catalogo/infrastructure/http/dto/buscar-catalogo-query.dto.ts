import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { TIPOS_OPERACION_VALIDOS, type TipoOperacion } from "../../../domain/types/tipo-operacion";

/**
 * GET /public/propiedades — query params del catálogo público (contrato DESIGN-029, paginación
 * ADR-015). Todos los filtros son opcionales y acumulativos (RN-024). Paginación pública:
 * `tamano_pagina` por defecto 12, máximo 48 (distinto del admin, ADR-015).
 */
export class BuscarCatalogoQueryDto {
  @IsOptional()
  @IsIn(TIPOS_OPERACION_VALIDOS, { message: "El tipo de operación no es válido." })
  tipo_operacion?: TipoOperacion;

  @IsOptional()
  @IsString({ message: "El tipo de propiedad no es válido." })
  tipo_propiedad?: string;

  @IsOptional()
  @IsString({ message: "La ciudad no es válida." })
  ciudad?: string;

  @IsOptional()
  @IsString({ message: "El barrio no es válido." })
  barrio?: string;

  @IsOptional()
  @IsString({ message: "El término de búsqueda no es válido." })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El precio mínimo debe ser un número entero." })
  @Min(0, { message: "El precio mínimo no puede ser negativo." })
  precio_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El precio máximo debe ser un número entero." })
  @Min(0, { message: "El precio máximo no puede ser negativo." })
  precio_max?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero." })
  @Min(1, { message: "La página debe ser mayor o igual a 1." })
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño de página debe ser un número entero." })
  @Min(1, { message: "El tamaño de página debe ser mayor o igual a 1." })
  @Max(48, { message: "El tamaño de página no puede ser mayor a 48." })
  tamano_pagina: number = 12;
}
