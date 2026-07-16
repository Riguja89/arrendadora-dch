import { IsIn, IsOptional, IsString } from "class-validator";
import { ESTADOS_PROPIEDAD_VALIDOS, type EstadoPropiedad } from "../../../domain/types/estado-propiedad";

/**
 * PATCH /admin/propiedades/{id}/estado — cuerpo del cambio de estado (DESIGN-028). La transición
 * concreta se valida en el aggregate contra la máquina de estados (RN-012); aquí solo se rechaza
 * un `estado_nuevo` que no pertenezca al conjunto válido.
 */
export class CambiarEstadoPropiedadDto {
  @IsIn(ESTADOS_PROPIEDAD_VALIDOS, { message: "El estado seleccionado no es válido." })
  estado_nuevo!: EstadoPropiedad;

  @IsOptional()
  @IsString({ message: "La nota no es válida." })
  nota?: string | null;
}
