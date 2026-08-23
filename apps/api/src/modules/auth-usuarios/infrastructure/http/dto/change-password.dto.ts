import { Expose } from "class-transformer";
import { IsString, MinLength } from "class-validator";

/** POST /auth/change-password — request body (campos snake_case, contrato DESIGN-028). */
export class ChangePasswordDto {
  @Expose({ name: "password_actual" })
  @IsString({ message: "La contraseña actual es obligatoria." })
  @MinLength(1, { message: "La contraseña actual es obligatoria." })
  passwordActual!: string;

  @Expose({ name: "password_nueva" })
  @IsString({ message: "La nueva contraseña es obligatoria." })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  passwordNueva!: string;
}
