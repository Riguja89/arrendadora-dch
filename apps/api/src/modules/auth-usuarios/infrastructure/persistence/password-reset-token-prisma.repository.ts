import { Injectable } from "@nestjs/common";
import type { PasswordResetToken as PasswordResetTokenPrisma, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import type { PasswordResetTokenRepositoryPort } from "../../domain/ports/password-reset-token.repository.port";

@Injectable()
export class PasswordResetTokenPrismaRepository implements PasswordResetTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(token: PasswordResetToken): Promise<void> {
    const props = token.toProps();
    const data: Prisma.PasswordResetTokenUncheckedCreateInput = {
      id: props.id,
      usuarioId: props.usuarioId,
      tokenHash: props.tokenHash,
      expiraEn: props.expiraEn,
      usado: props.usado,
      createdAt: props.createdAt,
    };
    await this.prisma.passwordResetToken.upsert({
      where: { id: props.id },
      create: data,
      update: { usado: props.usado },
    });
  }

  async buscarPorHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const registro = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      orderBy: { createdAt: "desc" },
    });
    return registro ? aDominio(registro) : null;
  }

  async invalidarTokensActivosDeUsuario(usuarioId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { usuarioId, usado: false },
      data: { usado: true },
    });
  }
}

function aDominio(registro: PasswordResetTokenPrisma): PasswordResetToken {
  return PasswordResetToken.reconstituir({
    id: registro.id,
    usuarioId: registro.usuarioId,
    tokenHash: registro.tokenHash,
    expiraEn: registro.expiraEn,
    usado: registro.usado,
    createdAt: registro.createdAt,
  });
}
