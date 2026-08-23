import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { TIPOS_OPERACION_VALIDOS, type TipoOperacion } from "../../../domain/types/tipo-operacion";
import { AmenidadItemDto } from "./amenidad-item.dto";

/**
 * POST /admin/propiedades — cuerpo de creación (`PropiedadCrear`, DESIGN-028). Los nombres de
 * propiedad respetan el snake_case del contrato; el controller los mapea a los inputs del caso de
 * uso. Las reglas de dominio (precio/área positivos — RN-017/RN-018) se validan también en el
 * aggregate; aquí se rechaza temprano el formato evidente.
 */
export class CrearPropiedadDto {
  @IsString({ message: "El título es obligatorio." })
  @MinLength(1, { message: "El título es obligatorio." })
  titulo!: string;

  @IsString({ message: "La descripción es obligatoria." })
  @MinLength(1, { message: "La descripción es obligatoria." })
  descripcion!: string;

  @IsIn(TIPOS_OPERACION_VALIDOS, { message: "El tipo de operación no es válido." })
  tipo_operacion!: TipoOperacion;

  @IsUUID("all", { message: "El tipo de propiedad seleccionado no es válido." })
  tipo_propiedad_id!: string;

  @IsString({ message: "La ciudad es obligatoria." })
  @MinLength(1, { message: "La ciudad es obligatoria." })
  ciudad!: string;

  @IsString({ message: "El barrio es obligatorio." })
  @MinLength(1, { message: "El barrio es obligatorio." })
  barrio!: string;

  @IsOptional()
  @IsString({ message: "La dirección no es válida." })
  direccion?: string | null;

  @IsInt({ message: "El precio debe ser un número entero en pesos colombianos, sin decimales." })
  @Min(1, { message: "El precio debe ser mayor a 0." })
  precio!: number;

  @IsInt({ message: "El área debe ser un número entero en metros cuadrados." })
  @Min(1, { message: "El área debe ser mayor a 0." })
  area!: number;

  @IsInt({ message: "El número de habitaciones debe ser un número entero." })
  @Min(0, { message: "El número de habitaciones no puede ser negativo." })
  habitaciones!: number;

  @IsInt({ message: "El número de baños debe ser un número entero." })
  @Min(0, { message: "El número de baños no puede ser negativo." })
  banos!: number;

  @IsOptional()
  @IsInt({ message: "El estrato debe ser un número entero." })
  @Min(1, { message: "El estrato debe estar entre 1 y 6." })
  @Max(6, { message: "El estrato debe estar entre 1 y 6." })
  estrato?: number | null;

  @IsOptional()
  @IsInt({ message: "El número de parqueaderos debe ser un número entero." })
  @Min(0, { message: "El número de parqueaderos no puede ser negativo." })
  parqueaderos?: number | null;

  @IsOptional()
  @IsBoolean({ message: "El campo destacada debe ser verdadero o falso." })
  destacada?: boolean;

  @IsOptional()
  @IsUUID("all", { message: "El agente responsable seleccionado no es válido." })
  agente_id?: string | null;

  @IsOptional()
  @IsArray({ message: "Las amenidades deben enviarse como una lista." })
  @ValidateNested({ each: true })
  @Type(() => AmenidadItemDto)
  amenidades?: AmenidadItemDto[];
}
