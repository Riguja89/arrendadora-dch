import { IsIn } from "class-validator";
import type { AccionEstadoUsuario } from "@arrendadora/shared";

const ACCIONES_VALIDAS: readonly AccionEstadoUsuario[] = ["activar", "desactivar", "desbloquear"];

/** PATCH /admin/usuarios/{id}/estado — request body (contrato DESIGN-028). */
export class CambiarEstadoDto {
  @IsIn(ACCIONES_VALIDAS, { message: "La acción solicitada no es válida." })
  accion!: AccionEstadoUsuario;
}
