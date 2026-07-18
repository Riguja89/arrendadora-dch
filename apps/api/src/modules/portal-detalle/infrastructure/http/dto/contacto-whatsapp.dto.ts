import { IsNotEmpty, IsString } from "class-validator";

/**
 * Cuerpo de `POST /public/propiedades/{slug}/contacto-whatsapp` (contrato DESIGN-029). El token de
 * reCAPTCHA v3 lo genera el cliente (ADR-007) y el backend lo verifica server-side. Vacío/ausente →
 * 422 (contrato `ErrorValidacion`), aplicado por el `ValidationPipe` global.
 */
export class ContactoWhatsappDto {
  @IsString({ message: "El token de validación es obligatorio." })
  @IsNotEmpty({ message: "El token de validación es obligatorio." })
  recaptcha_token!: string;
}
