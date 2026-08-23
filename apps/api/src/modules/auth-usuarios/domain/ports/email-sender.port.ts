export const EMAIL_SENDER = Symbol("EmailSenderPort");

export interface EmailEnviarInput {
  destinatario: string;
  asunto: string;
  cuerpo: string;
}

/**
 * Puerto de correo transaccional (ADR-009) — desacoplado del proveedor. El único caso de uso
 * que lo consume hoy es la recuperación de contraseña (RN-019); la creación de usuarios no
 * envía correo (GAP-004 opción A, ver `crear-usuario.use-case.ts`).
 */
export interface EmailSenderPort {
  enviar(input: EmailEnviarInput): Promise<void>;
}
