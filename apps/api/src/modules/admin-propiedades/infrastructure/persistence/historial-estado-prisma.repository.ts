import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import type { EstadoPropiedad } from "../../domain/types/estado-propiedad";
import type {
  HistorialEstadoLectura,
  HistorialEstadoRepositoryPort,
} from "../../domain/ports/historial-estado.repository.port";

/**
 * Adaptador de lectura del historial de estados (ADR-006). Resuelve `usuario_nombre` vía la
 * relación `historial → usuarios` para el contrato `HistorialEstado` (DESIGN-028). Es una lectura
 * de solo despliegue del nombre; la escritura del historial vive en `PropiedadPrismaRepository`
 * (misma transacción que el cambio de estado).
 */
@Injectable()
export class HistorialEstadoPrismaRepository implements HistorialEstadoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPropiedad(propiedadId: string): Promise<HistorialEstadoLectura[]> {
    const registros = await this.prisma.historialEstadoPropiedad.findMany({
      where: { propiedadId },
      orderBy: { cambiadoEn: "desc" },
      include: { usuario: { select: { nombre: true } } },
    });

    return registros.map((r) => ({
      id: r.id,
      estadoAnterior: r.estadoAnterior as EstadoPropiedad,
      estadoNuevo: r.estadoNuevo as EstadoPropiedad,
      usuarioId: r.usuarioId,
      usuarioNombre: r.usuario.nombre,
      nota: r.nota,
      cambiadoEn: r.cambiadoEn,
    }));
  }
}
