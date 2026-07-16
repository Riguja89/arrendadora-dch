import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import type { CatalogoItem } from "../../domain/entities/catalogo-item.entity";
import type { CatalogoRepositoryPort } from "../../domain/ports/catalogo.repository.port";
import { aCatalogoDatos, aCatalogoDominio } from "./catalogo-prisma.mapper";

/** Adaptador Prisma del catálogo `tipos_propiedad` (ADR-005). */
@Injectable()
export class TipoPropiedadPrismaRepository implements CatalogoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listar(incluirInactivos: boolean): Promise<CatalogoItem[]> {
    const registros = await this.prisma.tipoPropiedad.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });
    return registros.map(aCatalogoDominio);
  }

  async buscarPorId(id: string): Promise<CatalogoItem | null> {
    const registro = await this.prisma.tipoPropiedad.findUnique({ where: { id } });
    return registro ? aCatalogoDominio(registro) : null;
  }

  async buscarPorNombre(nombre: string): Promise<CatalogoItem | null> {
    const registro = await this.prisma.tipoPropiedad.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    return registro ? aCatalogoDominio(registro) : null;
  }

  async guardar(item: CatalogoItem): Promise<void> {
    const data = aCatalogoDatos(item);
    await this.prisma.tipoPropiedad.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async existenActivos(ids: string[]): Promise<boolean> {
    const unicos = [...new Set(ids)];
    if (unicos.length === 0) {
      return true;
    }
    const total = await this.prisma.tipoPropiedad.count({
      where: { id: { in: unicos }, activo: true },
    });
    return total === unicos.length;
  }
}
