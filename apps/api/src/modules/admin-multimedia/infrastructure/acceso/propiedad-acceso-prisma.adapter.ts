import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import type { PropiedadAcceso, PropiedadAccesoPort } from "../../domain/ports/propiedad-acceso.port";

/**
 * Adaptador de lectura del `PropiedadAccesoPort`. La multimedia es composición de `Propiedad`
 * (DESIGN-027): comparte la BD física con admin-propiedades y necesita una proyección mínima de la
 * propiedad (agente + visibilidad) para aplicar el RBAC por alcance y la regla de "no dejar visible
 * sin fotos" (ADR-008).
 *
 * DESVIACIÓN (CORE-006): lee directamente la tabla `propiedades` en lugar de consumir un query-port
 * expuesto por admin-propiedades (que hoy no existe). Se acota a una proyección `select` de solo
 * lectura de 3 columnas, sin replicar reglas de negocio de la propiedad. Cuando admin-propiedades
 * publique su propio `PropiedadQueryPort`, este adaptador debe delegar en él. Ver CLAUDE.md.
 */
@Injectable()
export class PropiedadAccesoPrismaAdapter implements PropiedadAccesoPort {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(propiedadId: string): Promise<PropiedadAcceso | null> {
    const propiedad = await this.prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { agenteId: true, archivada: true, publicadaEn: true },
    });
    if (!propiedad) {
      return null;
    }
    return {
      agenteId: propiedad.agenteId,
      // Visible en el portal = publicada y no archivada (ADR-008). Solo las visibles quedan
      // protegidas contra quedar sin fotos.
      esVisible: !propiedad.archivada && propiedad.publicadaEn !== null,
    };
  }
}
