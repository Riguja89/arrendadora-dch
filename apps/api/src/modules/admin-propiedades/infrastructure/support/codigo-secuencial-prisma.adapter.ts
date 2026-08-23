import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import type { GeneradorCodigoPort } from "../../domain/ports/generador-codigo.port";

const PREFIJO_CODIGO = "AP-";
const RELLENO = 3;

/**
 * Adaptador de generación del código legible secuencial (GAP-005, ej. `AP-001`). Estrategia MVP:
 * el siguiente número se deriva del conteo actual de propiedades.
 *
 * DESVIACIÓN documentada: esta estrategia basada en conteo tiene una condición de carrera teórica
 * bajo creaciones concurrentes (dos creaciones simultáneas podrían derivar el mismo número, que la
 * restricción UNIQUE de `codigo` rechazaría). Es aceptable para el volumen del MVP (<100
 * propiedades, un puñado de usuarios). La estrategia productiva recomendada es una **secuencia de
 * PostgreSQL** con formateo (ver TODO en `prisma/schema.prisma` sobre `Propiedad.codigo`), que se
 * incorporará vía migración SQL manual sin cambiar este puerto.
 */
@Injectable()
export class CodigoSecuencialPrismaAdapter implements GeneradorCodigoPort {
  constructor(private readonly prisma: PrismaService) {}

  async siguiente(): Promise<string> {
    const total = await this.prisma.propiedad.count();
    return `${PREFIJO_CODIGO}${String(total + 1).padStart(RELLENO, "0")}`;
  }
}
