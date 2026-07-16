import { Inject, Injectable } from "@nestjs/common";
import { Email } from "../../domain/value-objects/email.vo";
import { Sesion } from "../../domain/entities/sesion.entity";
import type { Usuario } from "../../domain/entities/usuario.entity";
import {
  CredencialesInvalidasError,
  CuentaBloqueadaError,
  CuentaDesactivadaError,
} from "../../domain/errors/dominio-auth.errors";
import { MAX_INTENTOS_FALLIDOS, SESION_TTL_MINUTOS } from "../../domain/rules/auth-constantes";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { SESION_REPOSITORY, type SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import { SECURE_TOKEN, type SecureTokenPort } from "../../domain/ports/secure-token.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface LoginInput {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}

export interface LoginResultado {
  usuario: Usuario;
  sesion: Sesion;
}

/**
 * CU-001 — Iniciar sesión. Orden de validación (contrato DESIGN-028): usuario inexistente →
 * 401 genérico; bloqueado/desactivado → 403; password incorrecta → 401 genérico (incrementa
 * el contador y puede disparar el bloqueo permanente, RN/GAP-006/ADR-004).
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(SESION_REPOSITORY) private readonly sesiones: SesionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(SECURE_TOKEN) private readonly secureToken: SecureTokenPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: LoginInput): Promise<LoginResultado> {
    const email = Email.crear(input.email);
    const usuario = await this.usuarios.buscarPorEmail(email.valor);

    // No revelar si el email existe (CU-001 Escenario 3, spec-005).
    if (!usuario) {
      throw new CredencialesInvalidasError();
    }

    if (usuario.estaBloqueado()) {
      throw new CuentaBloqueadaError();
    }
    if (usuario.estaDesactivado()) {
      throw new CuentaDesactivadaError();
    }

    const ahora = this.reloj.ahora();
    const passwordValida = await this.hasher.verificar(input.password, usuario.passwordHash);
    if (!passwordValida) {
      usuario.registrarIntentoFallido(MAX_INTENTOS_FALLIDOS, ahora);
      await this.usuarios.guardar(usuario);
      throw new CredencialesInvalidasError();
    }

    usuario.registrarIntentoExitoso(ahora);
    await this.usuarios.guardar(usuario);

    const sesion = Sesion.crear({
      id: this.secureToken.generarUuid(),
      usuarioId: usuario.id,
      ip: input.ip,
      userAgent: input.userAgent,
      ahora,
      ttlMinutos: SESION_TTL_MINUTOS,
    });
    await this.sesiones.guardar(sesion);

    return { usuario, sesion };
  }
}
