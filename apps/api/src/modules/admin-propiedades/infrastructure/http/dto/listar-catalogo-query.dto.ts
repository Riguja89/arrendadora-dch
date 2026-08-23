import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

/**
 * GET /admin/tipos-propiedad | /admin/amenidades — query params (DESIGN-028). `incluir_inactivos`
 * agrega los ítems dados de baja lógica (ADR-005); por defecto solo se listan los activos.
 */
export class ListarCatalogoQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean({ message: "El filtro incluir_inactivos debe ser verdadero o falso." })
  incluir_inactivos?: boolean;
}
