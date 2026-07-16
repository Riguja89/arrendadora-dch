import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import type { HistorialEstado } from "../../domain/entities/historial-estado.entity";
import type { EstadoPropiedad } from "../../domain/types/estado-propiedad";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import type {
  ListarPropiedadesFiltro,
  ListarPropiedadesResultado,
  PropiedadRepositoryPort,
} from "../../domain/ports/propiedad.repository.port";

/** Propiedad con sus amenidades cargadas (única forma en que este repo lee el aggregate). */
type PropiedadConAmenidades = Prisma.PropiedadGetPayload<{ include: { propiedadAmenidad: true } }>;

/**
 * Adaptador Prisma del puerto `PropiedadRepositoryPort`. Único punto del módulo que conoce el
 * modelo físico (regla del context map DESIGN-027). Traduce entre los tipos de dominio (número,
 * union types) y los del modelo (BigInt para el precio, Decimal para la ubicación, enums Prisma).
 */
@Injectable()
export class PropiedadPrismaRepository implements PropiedadRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(propiedad: Propiedad): Promise<void> {
    const props = propiedad.toProps();
    const data = aDatosPrisma(propiedad);

    await this.prisma.$transaction([
      this.prisma.propiedad.upsert({
        where: { id: props.id },
        create: data,
        update: data,
      }),
      // Sincroniza el N:M: se reemplaza el set completo de amenidades de la propiedad.
      this.prisma.propiedadAmenidad.deleteMany({ where: { propiedadId: props.id } }),
      this.prisma.propiedadAmenidad.createMany({
        data: props.amenidades.map((a) => ({
          propiedadId: props.id,
          amenidadId: a.amenidadId,
          cantidad: a.cantidad,
        })),
      }),
    ]);
  }

  async buscarPorId(id: string): Promise<Propiedad | null> {
    const registro = await this.prisma.propiedad.findUnique({
      where: { id },
      include: { propiedadAmenidad: true },
    });
    return registro ? aDominio(registro) : null;
  }

  async listar(filtro: ListarPropiedadesFiltro): Promise<ListarPropiedadesResultado> {
    const where: Prisma.PropiedadWhereInput = {
      ...(filtro.estado ? { estado: filtro.estado } : {}),
      ...(filtro.tipoOperacion ? { tipoOperacion: filtro.tipoOperacion } : {}),
      ...(filtro.tipoPropiedadId ? { tipoPropiedadId: filtro.tipoPropiedadId } : {}),
      ...(filtro.agenteId ? { agenteId: filtro.agenteId } : {}),
      ...(filtro.archivada !== undefined ? { archivada: filtro.archivada } : {}),
      ...(filtro.q
        ? {
            OR: [
              { titulo: { contains: filtro.q, mode: "insensitive" } },
              { codigo: { contains: filtro.q, mode: "insensitive" } },
              { direccion: { contains: filtro.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.propiedad.findMany({
        where,
        include: { propiedadAmenidad: true },
        skip: filtro.skip,
        take: filtro.take,
        orderBy: [{ publicadaEn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      }),
      this.prisma.propiedad.count({ where }),
    ]);

    return { items: registros.map(aDominio), total };
  }

  async cambiarEstado(propiedad: Propiedad, historial: HistorialEstado): Promise<void> {
    const props = propiedad.toProps();
    const h = historial.toProps();

    // ADR-006 / DEI-001 — actualizar el estado y registrar el historial en la misma transacción.
    await this.prisma.$transaction([
      this.prisma.propiedad.update({
        where: { id: props.id },
        data: { estado: props.estado, updatedAt: props.updatedAt },
      }),
      this.prisma.historialEstadoPropiedad.create({
        data: {
          id: h.id,
          propiedadId: h.propiedadId,
          estadoAnterior: h.estadoAnterior,
          estadoNuevo: h.estadoNuevo,
          usuarioId: h.usuarioId,
          nota: h.nota,
          cambiadoEn: h.cambiadoEn,
        },
      }),
    ]);
  }
}

function aDatosPrisma(propiedad: Propiedad): Prisma.PropiedadUncheckedCreateInput {
  const props = propiedad.toProps();
  return {
    id: props.id,
    codigo: props.codigo,
    titulo: props.titulo,
    slug: props.slug,
    descripcion: props.descripcion,
    tipoOperacion: props.tipoOperacion,
    tipoPropiedadId: props.tipoPropiedadId,
    ciudad: props.ciudad,
    barrio: props.barrio,
    direccion: props.direccion,
    precio: BigInt(props.precio),
    area: props.area,
    habitaciones: props.habitaciones,
    banos: props.banos,
    estrato: props.estrato,
    parqueaderos: props.parqueaderos,
    estado: props.estado,
    destacada: props.destacada,
    archivada: props.archivada,
    agenteId: props.agenteId,
    latitud: props.latitud,
    longitud: props.longitud,
    publicadaEn: props.publicadaEn,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}

function aDominio(registro: PropiedadConAmenidades): Propiedad {
  return Propiedad.reconstituir({
    id: registro.id,
    codigo: registro.codigo,
    titulo: registro.titulo,
    slug: registro.slug,
    descripcion: registro.descripcion,
    tipoOperacion: registro.tipoOperacion as TipoOperacion,
    tipoPropiedadId: registro.tipoPropiedadId,
    ciudad: registro.ciudad,
    barrio: registro.barrio,
    direccion: registro.direccion,
    precio: Number(registro.precio),
    area: registro.area,
    habitaciones: registro.habitaciones,
    banos: registro.banos,
    estrato: registro.estrato,
    parqueaderos: registro.parqueaderos,
    estado: registro.estado as EstadoPropiedad,
    destacada: registro.destacada,
    archivada: registro.archivada,
    agenteId: registro.agenteId,
    latitud: registro.latitud === null ? null : Number(registro.latitud),
    longitud: registro.longitud === null ? null : Number(registro.longitud),
    amenidades: registro.propiedadAmenidad.map((pa) => ({
      amenidadId: pa.amenidadId,
      cantidad: pa.cantidad,
    })),
    publicadaEn: registro.publicadaEn,
    createdAt: registro.createdAt,
    updatedAt: registro.updatedAt,
  });
}
