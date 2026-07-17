import { IsString, MinLength } from "class-validator";

/**
 * `PUT /admin/configuracion` — request body (`ConfiguracionSistemaEditar`, contrato DESIGN-028).
 * Los nombres respetan el snake_case del contrato; el controller los mapea a los inputs del caso de
 * uso. La validación fina (formato de WhatsApp, marcador `{codigo}`, URL de imagen) vive en el
 * dominio; aquí solo se rechaza temprano el formato evidente (campos vacíos).
 *
 * Decisión (CORE-006): el schema no declara un array `required`, pero el verbo es PUT (reemplazo
 * total del singleton, no PATCH parcial) — se exigen los 4 campos editables. Documentado en el
 * CLAUDE.md del módulo.
 */
export class ActualizarConfiguracionDto {
  @IsString({ message: "El número de WhatsApp es obligatorio." })
  @MinLength(1, { message: "El número de WhatsApp es obligatorio." })
  whatsapp_numero_central!: string;

  @IsString({ message: "La plantilla del mensaje es obligatoria." })
  @MinLength(1, { message: "La plantilla del mensaje es obligatoria." })
  whatsapp_plantilla_mensaje!: string;

  @IsString({ message: "El nombre de la inmobiliaria es obligatorio." })
  @MinLength(1, { message: "El nombre de la inmobiliaria es obligatorio." })
  nombre_inmobiliaria!: string;

  @IsString({ message: "La imagen genérica es obligatoria." })
  @MinLength(1, { message: "La imagen genérica es obligatoria." })
  imagen_generica_url!: string;
}
