import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { ROLES_VALIDOS, type Rol } from "../../../domain/types/rol";

/** PUT /admin/usuarios/{id} — request body (`UsuarioEditar`, contrato DESIGN-028). */
export class EditarUsuarioDto {
  @IsOptional()
  @IsString({ message: "El nombre no es válido." })
  @MinLength(1, { message: "El nombre no puede estar vacío." })
  nombre?: string;

  @IsOptional()
  @IsIn(ROLES_VALIDOS, { message: "El rol seleccionado no es válido." })
  rol?: Rol;

  @IsOptional()
  @IsString({ message: "El número de WhatsApp no es válido." })
  whatsapp?: string | null;
}
