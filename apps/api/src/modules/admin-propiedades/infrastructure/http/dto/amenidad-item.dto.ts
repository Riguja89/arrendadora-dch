import { IsInt, IsUUID, Min } from "class-validator";

/** Ítem de amenidad en el cuerpo de crear/editar propiedad (`PropiedadAmenidadCrear`, DESIGN-028). */
export class AmenidadItemDto {
  @IsUUID("all", { message: "El identificador de la amenidad no es válido." })
  amenidad_id!: string;

  @IsInt({ message: "La cantidad de la amenidad debe ser un número entero." })
  @Min(1, { message: "La cantidad de la amenidad debe ser mayor o igual a 1." })
  cantidad!: number;
}
