import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import type { SesionUsuario } from "@arrendadora/shared";
import type { AppConfig } from "../../../../config/configuration";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { LogoutUseCase } from "../../application/use-cases/logout.use-case";
import { CambiarPasswordUseCase } from "../../application/use-cases/cambiar-password.use-case";
import { SolicitarRecuperacionPasswordUseCase } from "../../application/use-cases/solicitar-recuperacion-password.use-case";
import { RestablecerPasswordConTokenUseCase } from "../../application/use-cases/restablecer-password-con-token.use-case";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { aSesionUsuarioWire } from "./mappers/usuario.mapper";
import { COOKIE_SESION } from "./cookie.util";
import { SessionAuthGuard, type RequestConUsuario } from "./guards/session-auth.guard";

/** Ciclo de sesión — login, logout, recuperación de contraseña (ADR-004, CU-001, CU-002). */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly cambiarPasswordUseCase: CambiarPasswordUseCase,
    private readonly solicitarRecuperacionUseCase: SolicitarRecuperacionPasswordUseCase,
    private readonly restablecerPasswordUseCase: RestablecerPasswordConTokenUseCase,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SesionUsuario> {
    const userAgentHeader = req.headers["user-agent"];
    const { usuario, sesion } = await this.loginUseCase.ejecutar({
      email: dto.email,
      password: dto.password,
      ip: req.ip ?? null,
      userAgent: Array.isArray(userAgentHeader) ? (userAgentHeader[0] ?? null) : (userAgentHeader ?? null),
    });

    this.setCookieSesion(res, sesion.id, sesion.expiraEn);
    return aSesionUsuarioWire(usuario);
  }

  @Post("logout")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: RequestConUsuario,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.logoutUseCase.ejecutar({ sesionId: req.sesionId });
    res.clearCookie(COOKIE_SESION, { path: "/" });
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    // RN-019 — respuesta siempre neutra, exista o no el email (no revela enumeración).
    await this.solicitarRecuperacionUseCase.ejecutar({
      email: dto.email,
      urlBasePanel: this.config.get("panelUrl", { infer: true }),
    });
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.restablecerPasswordUseCase.ejecutar({
      tokenPlano: dto.token,
      passwordNueva: dto.passwordNueva,
    });
  }

  @Post("change-password")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: RequestConUsuario,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.cambiarPasswordUseCase.ejecutar({
      usuarioId: req.usuario.id,
      passwordActual: dto.passwordActual,
      passwordNueva: dto.passwordNueva,
    });
    // El caso de uso revoca todas las sesiones (incluida la actual) — limpiar la cookie local.
    res.clearCookie(COOKIE_SESION, { path: "/" });
  }

  private setCookieSesion(res: Response, sesionId: string, expiraEn: Date): void {
    res.cookie(COOKIE_SESION, sesionId, {
      httpOnly: true,
      secure: this.config.get("nodeEnv", { infer: true }) === "production",
      sameSite: "lax",
      path: "/",
      expires: expiraEn,
    });
  }
}
