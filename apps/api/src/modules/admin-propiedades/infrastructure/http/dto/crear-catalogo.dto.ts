import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

/**
 * POST /admin/tipos-propiedad | /admin/amenidades — alta de un ítem de catálogo (`CatalogoCrear`,
 * DESIGN-028, ADR-005). El `orden` es opcional en el contrato; cuando se omite se asume 0.
 */
export class CrearCatalogoDto {
  @IsString({ message: "El nombre es obligatorio." })
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @IsOptional()
  @IsInt({ message: "El orden debe ser un número entero." })
  @Min(0, { message: "El orden no puede ser negativo." })
  orden?: number | null;
}
