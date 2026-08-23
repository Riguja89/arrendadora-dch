import { Expose } from "class-transformer";
import { IsString, MinLength } from "class-validator";

/** POST /auth/reset-password — request body (campos snake_case, contrato DESIGN-028). */
export class ResetPasswordDto {
  @IsString({ message: "El token es obligatorio." })
  @MinLength(1, { message: "El token es obligatorio." })
  token!: string;

  @Expose({ name: "password_nueva" })
  @IsString({ message: "La nueva contraseña es obligatoria." })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  passwordNueva!: string;
}
