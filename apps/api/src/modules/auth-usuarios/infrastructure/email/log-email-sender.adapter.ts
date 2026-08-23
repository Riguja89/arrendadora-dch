import { Injectable, Logger } from "@nestjs/common";
import type { EmailEnviarInput, EmailSenderPort } from "../../domain/ports/email-sender.port";

/**
 * Adaptador no-op/log del `EmailPort` (ADR-009) — MVP sin proveedor de correo configurado
 * (GAP-003: sin presupuesto para dominio propio). Loguea el envío sin bloquear el flujo de
 * recuperación de contraseña; el Administrador puede usar el reset manual como respaldo
 * operativo mientras no exista un proveedor real. Reemplazable por un adaptador SMTP/SES/Brevo
 * sin tocar el dominio ni los casos de uso — solo el binding en `auth-usuarios.module.ts`.
 */
@Injectable()
export class LogEmailSenderAdapter implements EmailSenderPort {
  private readonly logger = new Logger(LogEmailSenderAdapter.name);

  async enviar(input: EmailEnviarInput): Promise<void> {
    this.logger.log(
      `[email:no-op] destinatario=${input.destinatario} asunto="${input.asunto}" — proveedor de correo no configurado (GAP-003, ADR-009); el envío se omite en este MVP.`,
    );
  }
}
