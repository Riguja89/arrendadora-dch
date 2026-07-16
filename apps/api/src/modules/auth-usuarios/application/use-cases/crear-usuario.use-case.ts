import { Inject, Injectable } from "@nestjs/common";
import { Email } from "../../domain/value-objects/email.vo";
import { Usuario } from "../../domain/entities/usuario.entity";
import type { Rol } from "../../domain/types/rol";
import { EmailYaRegistradoError } from "../../domain/errors/dominio-auth.errors";
import { PASSWORD_TEMPORAL_LONGITUD } from "../../domain/rules/auth-constantes";
import { USUARIO_REPOSITORY, type UsuarioRepositoryPort } from "../../domain/ports/usuario.repository.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/ports/password-hasher.port";
import { SECURE_TOKEN, type SecureTokenPort } from "../../domain/ports/secure-token.port";
import { RELOJ, type RelojPort } from "../../domain/ports/reloj.port";

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  rol: Rol;
  whatsapp: string | null;
}

export interface CrearUsuarioResultado {
  usuario: Usuario;
  /**
   * Contraseña temporal en texto plano — SOLO existe en este resultado, en memoria, para que
   * el controller la devuelva una única vez al Administrador (GAP-004 opción A: "el
   * Administrador ingresa/comparte una contraseña temporal"). Nunca se persiste en texto
   * plano ni se loguea. Ver CLAUDE.md del módulo para la nota sobre el campo aditivo
   * `password_temporal` (no documentado en el OpenAPI `UsuarioCrear`, que no acepta password
   * de entrada — el sistema la genera).
   */
  passwordTemporal: string;
}

/**
 * CU-003 — Crear usuario interno (solo Administrador, enforced en el controller vía RBAC).
 * RN-038 (WhatsApp obligatorio para Agente) fue superseded por la resolución de GAP-002
 * (Modelo B — WhatsApp central en ConfiguracionSistema); el campo queda opcional/informativo
 * en Usuario, consistente con el schema Prisma y el contrato OpenAPI (`whatsapp` nullable).
 */
@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(SECURE_TOKEN) private readonly secureToken: SecureTokenPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(input: CrearUsuarioInput): Promise<CrearUsuarioResultado> {
    const email = Email.crear(input.email);

    if (await this.usuarios.existeEmail(email.valor)) {
      throw new EmailYaRegistradoError();
    }

    const passwordTemporal = this.secureToken.generarPasswordTemporal(PASSWORD_TEMPORAL_LONGITUD);
    const passwordHash = await this.hasher.hash(passwordTemporal);

    const usuario = Usuario.crear({
      id: this.secureToken.generarUuid(),
      nombre: input.nombre,
      email: email.valor,
      passwordHash,
      rol: input.rol,
      whatsapp: input.whatsapp ?? null,
      ahora: this.reloj.ahora(),
    });
    await this.usuarios.guardar(usuario);

    return { usuario, passwordTemporal };
  }
}
