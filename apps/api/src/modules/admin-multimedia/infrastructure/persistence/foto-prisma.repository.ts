import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { Foto } from "../../domain/entities/foto.entity";
import type { FormatoImagen } from "../../domain/value-objects/formato-imagen.vo";
import type { FotoRepositoryPort } from "../../domain/ports/foto.repository.port";

/**
 * Adaptador Prisma del `FotoRepositoryPort`. Único punto del módulo que conoce la tabla física
 * `fotos` (ADR-008: metadatos en PostgreSQL, binarios en S3). `formatoOriginal` se persiste como
 * texto y se reinterpreta como `FormatoImagen` al reconstituir.
 */
@Injectable()
export class FotoPrismaRepository implements FotoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPropiedad(propiedadId: string): Promise<Foto[]> {
    const registros = await this.prisma.foto.findMany({
      where: { propiedadId },
      orderBy: { orden: "asc" },
    });
    return registros.map(aDominio);
  }

  async sincronizar(input: {
    propiedadId: string;
    fotos: Foto[];
    idsEliminadas: string[];
  }): Promise<void> {
    const operaciones: Prisma.PrismaPromise<unknown>[] = [];

    if (input.idsEliminadas.length > 0) {
      operaciones.push(
        this.prisma.foto.deleteMany({ where: { id: { in: input.idsEliminadas } } }),
      );
    }

    for (const foto of input.fotos) {
      const p = foto.toProps();
      operaciones.push(
        this.prisma.foto.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            propiedadId: p.propiedadId,
            orden: p.orden,
            esPortada: p.esPortada,
            s3KeyBase: p.s3KeyBase,
            formatoOriginal: p.formatoOriginal,
            createdAt: p.createdAt,
          },
          update: {
            orden: p.orden,
            esPortada: p.esPortada,
            s3KeyBase: p.s3KeyBase,
            formatoOriginal: p.formatoOriginal,
          },
        }),
      );
    }

    // Sincroniza la galería completa en una sola transacción (DEI-001).
    await this.prisma.$transaction(operaciones);
  }
}

function aDominio(registro: {
  id: string;
  propiedadId: string;
  orden: number;
  esPortada: boolean;
  s3KeyBase: string;
  formatoOriginal: string;
  createdAt: Date;
  updatedAt: Date;
}): Foto {
  return Foto.reconstituir({
    id: registro.id,
    propiedadId: registro.propiedadId,
    orden: registro.orden,
    esPortada: registro.esPortada,
    s3KeyBase: registro.s3KeyBase,
    formatoOriginal: registro.formatoOriginal as FormatoImagen,
    createdAt: registro.createdAt,
    updatedAt: registro.updatedAt,
  });
}
