import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

/**
 * PATCH /admin/tipos-propiedad/{id} | /admin/amenidades/{id} — edición parcial de un ítem de
 * catálogo (`CatalogoEditar`, DESIGN-028). Todos los campos son opcionales; solo se aplican los
 * presentes en el cuerpo (el caso de uso ignora los `undefined`).
 */
export class EditarCatalogoDto {
  @IsOptional()
  @IsString({ message: "El nombre no es válido." })
  @MinLength(1, { message: "El nombre no puede estar vacío." })
  nombre?: string;

  @IsOptional()
  @IsInt({ message: "El orden debe ser un número entero." })
  @Min(0, { message: "El orden no puede ser negativo." })
  orden?: number;

  @IsOptional()
  @IsBoolean({ message: "El campo activo debe ser verdadero o falso." })
  activo?: boolean;
}
