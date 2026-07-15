import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Adaptador de infraestructura sobre Prisma (ADR-003). Cada módulo/bounded context inyecta
 * este servicio SOLO dentro de sus propios repositorios — regla del context map (DESIGN-027):
 * "prohibido el acoplamiento por base de datos", cada contexto accede exclusivamente a través
 * de sus propios repositorios.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
