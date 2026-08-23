import { Injectable } from "@nestjs/common";
import type { Sesion as SesionPrisma, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { Sesion } from "../../domain/entities/sesion.entity";
import type { SesionRepositoryPort } from "../../domain/ports/sesion.repository.port";

@Injectable()
export class SesionPrismaRepository implements SesionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(sesion: Sesion): Promise<void> {
    const props = sesion.toProps();
    const data: Prisma.SesionUncheckedCreateInput = {
      id: props.id,
      usuarioId: props.usuarioId,
      expiraEn: props.expiraEn,
      ip: props.ip,
      userAgent: props.userAgent,
      createdAt: props.createdAt,
    };
    await this.prisma.sesion.upsert({
      where: { id: props.id },
      create: data,
      update: { expiraEn: props.expiraEn },
    });
  }

  async buscarPorId(id: string): Promise<Sesion | null> {
    const registro = await this.prisma.sesion.findUnique({ where: { id } });
    return registro ? aDominio(registro) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.sesion.deleteMany({ where: { id } });
  }

  async eliminarTodasDeUsuario(usuarioId: string): Promise<void> {
    await this.prisma.sesion.deleteMany({ where: { usuarioId } });
  }
}

function aDominio(registro: SesionPrisma): Sesion {
  return Sesion.reconstituir({
    id: registro.id,
    usuarioId: registro.usuarioId,
    expiraEn: registro.expiraEn,
    ip: registro.ip,
    userAgent: registro.userAgent,
    createdAt: registro.createdAt,
  });
}
