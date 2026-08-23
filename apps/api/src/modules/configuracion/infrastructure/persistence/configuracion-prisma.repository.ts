import { Injectable } from "@nestjs/common";
import type { ConfiguracionSistema as ConfiguracionPrisma, Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { ConfiguracionSistema } from "../../domain/entities/configuracion-sistema.entity";
import type { ConfiguracionRepositoryPort } from "../../domain/ports/configuracion.repository.port";
import { CONFIGURACION_SINGLETON_ID } from "../../domain/rules/configuracion-constantes";

/**
 * Adaptador Prisma del puerto `ConfiguracionRepositoryPort`. Único punto del módulo que conoce el
 * modelo físico (regla del context map DESIGN-027). El `upsert` sobre el id fijo del singleton es
 * la garantía a nivel de aplicación de que nunca exista más de una fila (ADR-016).
 */
@Injectable()
export class ConfiguracionPrismaRepository implements ConfiguracionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(): Promise<ConfiguracionSistema | null> {
    const registro = await this.prisma.configuracionSistema.findUnique({
      where: { id: CONFIGURACION_SINGLETON_ID },
    });
    return registro ? aDominio(registro) : null;
  }

  async guardar(configuracion: ConfiguracionSistema): Promise<void> {
    const props = configuracion.toProps();
    const data: Prisma.ConfiguracionSistemaUncheckedCreateInput = {
      id: props.id,
      whatsappNumeroCentral: props.whatsappNumeroCentral,
      whatsappPlantillaMensaje: props.whatsappPlantillaMensaje,
      nombreInmobiliaria: props.nombreInmobiliaria,
      imagenGenericaUrl: props.imagenGenericaUrl,
      actualizadaPor: props.actualizadaPor,
      updatedAt: props.updatedAt,
    };
    await this.prisma.configuracionSistema.upsert({
      where: { id: props.id },
      create: data,
      update: data,
    });
  }
}

function aDominio(registro: ConfiguracionPrisma): ConfiguracionSistema {
  return ConfiguracionSistema.reconstituir({
    id: registro.id,
    whatsappNumeroCentral: registro.whatsappNumeroCentral,
    whatsappPlantillaMensaje: registro.whatsappPlantillaMensaje,
    nombreInmobiliaria: registro.nombreInmobiliaria,
    imagenGenericaUrl: registro.imagenGenericaUrl,
    actualizadaPor: registro.actualizadaPor,
    updatedAt: registro.updatedAt,
  });
}
