import { IsEmail } from "class-validator";

/** POST /auth/forgot-password — request body. */
export class ForgotPasswordDto {
  @IsEmail({}, { message: "El correo electrónico no es válido." })
  email!: string;
}
