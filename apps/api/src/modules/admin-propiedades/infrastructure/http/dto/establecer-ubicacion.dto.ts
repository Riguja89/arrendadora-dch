import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

/**
 * PUT /admin/propiedades/{id}/ubicacion — cuerpo (DESIGN-028). Nombres de propiedad en
 * snake_case (mismo criterio que el resto de los DTOs de este módulo). Body JSON (no query
 * params) — SIN `@Type(() => Number)`: el cliente ya envía números/null nativos y coaccionar con
 * `Number(null)` los convertiría en `0`, perdiendo la señal "ausente" que necesita
 * `resolverModoUbicacion` (mismo criterio que `estrato`/`parqueaderos` en `crear-propiedad.dto.ts`).
 * Solo valida forma/rango de cada campo por separado — la exclusión mutua entre modo manual y
 * `geocodificar_direccion` (RN-033) es una regla de negocio cross-campo y se valida en el
 * dominio (`resolverModoUbicacion`), no acá.
 */
export class EstablecerUbicacionDto {
  @IsOptional()
  @IsNumber({}, { message: "La latitud debe ser un número." })
  @Min(-90, { message: "La latitud debe estar entre -90 y 90." })
  @Max(90, { message: "La latitud debe estar entre -90 y 90." })
  latitud?: number | null;

  @IsOptional()
  @IsNumber({}, { message: "La longitud debe ser un número." })
  @Min(-180, { message: "La longitud debe estar entre -180 y 180." })
  @Max(180, { message: "La longitud debe estar entre -180 y 180." })
  longitud?: number | null;

  @IsOptional()
  @IsBoolean({ message: "El campo geocodificar_direccion debe ser verdadero o falso." })
  geocodificar_direccion?: boolean;
}
