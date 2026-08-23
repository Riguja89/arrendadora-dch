import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { ROLES_VALIDOS, type Rol } from "../../../domain/types/rol";

/** POST /admin/usuarios — request body (`UsuarioCrear`, contrato DESIGN-028). */
export class CrearUsuarioDto {
  @IsString({ message: "El nombre es obligatorio." })
  @MinLength(1, { message: "El nombre es obligatorio." })
  nombre!: string;

  @IsEmail({}, { message: "El correo electrónico no es válido." })
  email!: string;

  @IsIn(ROLES_VALIDOS, { message: "El rol seleccionado no es válido." })
  rol!: Rol;

  @IsOptional()
  @IsString({ message: "El número de WhatsApp no es válido." })
  whatsapp?: string | null;
}
