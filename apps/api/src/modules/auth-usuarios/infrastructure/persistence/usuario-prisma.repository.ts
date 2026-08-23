import { Injectable } from "@nestjs/common";
import type { Usuario as UsuarioPrisma, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { Usuario } from "../../domain/entities/usuario.entity";
import type { Rol } from "../../domain/types/rol";
import type { EstadoUsuario } from "../../domain/types/estado-usuario";
import type {
  ListarUsuariosFiltro,
  ListarUsuariosResultado,
  UsuarioRepositoryPort,
} from "../../domain/ports/usuario.repository.port";

/**
 * Adaptador Prisma del puerto `UsuarioRepositoryPort`. Único punto del módulo que conoce el
 * modelo físico (regla del context map DESIGN-027: cada bounded context accede solo a sus
 * propios repositorios).
 */
@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(usuario: Usuario): Promise<void> {
    const props = usuario.toProps();
    const data: Prisma.UsuarioUncheckedCreateInput = {
      id: props.id,
      nombre: props.nombre,
      email: props.email,
      passwordHash: props.passwordHash,
      rol: props.rol,
      estado: props.estado,
      whatsapp: props.whatsapp,
      intentosFallidos: props.intentosFallidos,
      requiereCambioPassword: props.requiereCambioPassword,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
    await this.prisma.usuario.upsert({
      where: { id: props.id },
      create: data,
      update: data,
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } });
    return registro ? aDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { email } });
    return registro ? aDominio(registro) : null;
  }

  async existeEmail(email: string): Promise<boolean> {
    const registro = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    return registro !== null;
  }

  async listar(filtro: ListarUsuariosFiltro): Promise<ListarUsuariosResultado> {
    const where: Prisma.UsuarioWhereInput = {
      ...(filtro.estado ? { estado: filtro.estado } : {}),
      ...(filtro.rol ? { rol: filtro.rol } : {}),
    };

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip: filtro.skip,
        take: filtro.take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items: registros.map(aDominio), total };
  }
}

function aDominio(registro: UsuarioPrisma): Usuario {
  return Usuario.reconstituir({
    id: registro.id,
    nombre: registro.nombre,
    email: registro.email,
    passwordHash: registro.passwordHash,
    // El schema Prisma tipa `rol`/`estado` con enums propios; el dominio usa union types
    // literales equivalentes (mismos valores) para no depender de `@prisma/client`.
    rol: registro.rol as Rol,
    estado: registro.estado as EstadoUsuario,
    whatsapp: registro.whatsapp,
    intentosFallidos: registro.intentosFallidos,
    requiereCambioPassword: registro.requiereCambioPassword,
    createdAt: registro.createdAt,
    updatedAt: registro.updatedAt,
  });
}
