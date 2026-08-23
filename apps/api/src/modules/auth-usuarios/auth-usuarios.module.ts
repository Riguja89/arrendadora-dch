import { Module } from "@nestjs/common";

import { USUARIO_REPOSITORY } from "./domain/ports/usuario.repository.port";
import { SESION_REPOSITORY } from "./domain/ports/sesion.repository.port";
import { PASSWORD_RESET_TOKEN_REPOSITORY } from "./domain/ports/password-reset-token.repository.port";
import { PASSWORD_HASHER } from "./domain/ports/password-hasher.port";
import { EMAIL_SENDER } from "./domain/ports/email-sender.port";
import { SECURE_TOKEN } from "./domain/ports/secure-token.port";
import { RELOJ } from "./domain/ports/reloj.port";

import { UsuarioPrismaRepository } from "./infrastructure/persistence/usuario-prisma.repository";
import { SesionPrismaRepository } from "./infrastructure/persistence/sesion-prisma.repository";
import { PasswordResetTokenPrismaRepository } from "./infrastructure/persistence/password-reset-token-prisma.repository";
import { BcryptPasswordHasherAdapter } from "./infrastructure/security/bcrypt-password-hasher.adapter";
import { CryptoSecureTokenAdapter } from "./infrastructure/security/crypto-secure-token.adapter";
import { RelojSistemaAdapter } from "./infrastructure/security/reloj-sistema.adapter";
import { LogEmailSenderAdapter } from "./infrastructure/email/log-email-sender.adapter";

import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { ValidarSesionUseCase } from "./application/use-cases/validar-sesion.use-case";
import { CambiarPasswordUseCase } from "./application/use-cases/cambiar-password.use-case";
import { SolicitarRecuperacionPasswordUseCase } from "./application/use-cases/solicitar-recuperacion-password.use-case";
import { RestablecerPasswordConTokenUseCase } from "./application/use-cases/restablecer-password-con-token.use-case";
import { CrearUsuarioUseCase } from "./application/use-cases/crear-usuario.use-case";
import { ListarUsuariosUseCase } from "./application/use-cases/listar-usuarios.use-case";
import { ObtenerUsuarioUseCase } from "./application/use-cases/obtener-usuario.use-case";
import { EditarUsuarioUseCase } from "./application/use-cases/editar-usuario.use-case";
import { CambiarEstadoUsuarioUseCase } from "./application/use-cases/cambiar-estado-usuario.use-case";

import { AuthController } from "./infrastructure/http/auth.controller";
import { UsuariosController } from "./infrastructure/http/usuarios.controller";
import { SessionAuthGuard } from "./infrastructure/http/guards/session-auth.guard";
import { RolesGuard } from "./infrastructure/http/guards/roles.guard";

/**
 * 5. Autenticación y Usuarios (ANALYZE-005).
 * Identidad, RBAC (administrador/agente/editor), sesiones server-side (ADR-004) y ciclo de
 * vida de usuarios. Upstream (Customer/Supplier) de admin-propiedades y admin-multimedia
 * (DESIGN-027).
 *
 * Endpoints: /auth/login, /auth/logout, /auth/forgot-password, /auth/reset-password,
 * /auth/change-password, /admin/usuarios* (DESIGN-028).
 */
@Module({
  imports: [],
  controllers: [AuthController, UsuariosController],
  providers: [
    // Puertos → adaptadores de infraestructura
    { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
    { provide: SESION_REPOSITORY, useClass: SesionPrismaRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: PasswordResetTokenPrismaRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherAdapter },
    { provide: SECURE_TOKEN, useClass: CryptoSecureTokenAdapter },
    { provide: RELOJ, useClass: RelojSistemaAdapter },
    { provide: EMAIL_SENDER, useClass: LogEmailSenderAdapter },

    // Casos de uso (aplicación)
    LoginUseCase,
    LogoutUseCase,
    ValidarSesionUseCase,
    CambiarPasswordUseCase,
    SolicitarRecuperacionPasswordUseCase,
    RestablecerPasswordConTokenUseCase,
    CrearUsuarioUseCase,
    ListarUsuariosUseCase,
    ObtenerUsuarioUseCase,
    EditarUsuarioUseCase,
    CambiarEstadoUsuarioUseCase,

    // Guards HTTP (dependen de ValidarSesionUseCase — se resuelven vía DI del módulo)
    SessionAuthGuard,
    RolesGuard,
  ],
  // Exporta los guards y su dependencia (ValidarSesionUseCase) para que otros bounded contexts
  // downstream — admin-propiedades, admin-multimedia — reutilicen la identidad/RBAC sin re-proveer
  // la cadena de autenticación (Customer/Supplier, DESIGN-027). ValidarSesionUseCase se exporta
  // porque Nest reconstruye el guard en el injector del módulo consumidor y necesita resolverlo ahí.
  exports: [SessionAuthGuard, RolesGuard, ValidarSesionUseCase],
})
export class AuthUsuariosModule {}
