import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/** Módulo global — expone PrismaService a todos los módulos de bounded context. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
