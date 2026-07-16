import { Inject, Injectable } from "@nestjs/common";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";

export interface LogoutInput {
  sesionId: string;
}

/** POST /auth/logout — revoca la sesión actual de inmediato (ADR-004). */
@Injectable()
export class LogoutUseCase {
  constructor(@Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort) {}

  async ejecutar(input: LogoutInput): Promise<void> {
    await this.sesiones.eliminar(input.sesionId);
  }
}
