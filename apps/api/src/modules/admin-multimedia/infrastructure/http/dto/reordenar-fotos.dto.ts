import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

/** Cuerpo de `PATCH /admin/propiedades/{id}/fotos/orden` — IDs de foto en el nuevo orden (RN-031). */
export class ReordenarFotosDto {
  @IsArray({ message: "El orden debe ser una lista de identificadores de foto." })
  @ArrayNotEmpty({ message: "Debés indicar al menos una foto en el orden." })
  @IsUUID("4", { each: true, message: "Cada identificador de foto debe ser un UUID válido." })
  orden!: string[];
}
