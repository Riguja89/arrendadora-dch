import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import type {
  FiltroBusquedaCatalogo,
  PropiedadCatalogoRepositoryPort,
  ResultadoBusquedaCatalogo,
} from "../../domain/ports/propiedad-catalogo.repository.port";
import type { PropiedadCatalogo } from "../../domain/read-models/propiedad-catalogo.read-model";
import type { TipoPropiedadPublico } from "../../domain/read-models/tipo-propiedad-publico.read-model";
import type { CiudadConteo } from "../../domain/read-models/ciudad-conteo.read-model";
import type { EstadoVisiblePublico } from "../../domain/types/estado-visible-publico";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import { ESTADOS_VISIBLES_PUBLICO } from "../../domain/rules/visibilidad-publica";

/** Proyección `select` mínima de la tabla `propiedades` para las tarjetas del catálogo. */
const SELECCION_CATALOGO = {
  id: true,
  codigo: true,
  titulo: true,
  slug: true,
  tipoOperacion: true,
  ciudad: true,
  barrio: true,
  precio: true,
  area: true,
  habitaciones: true,
  banos: true,
  estado: true,
  destacada: true,
  publicadaEn: true,
  createdAt: true,
  tipoPropiedad: { select: { nombre: true } },
} satisfies Prisma.PropiedadSelect;

/** Orden por recencia de publicación (RN-024): publicadas primero (más recientes), nulls al final. */
const ORDEN_RECENCIA: Prisma.PropiedadOrderByWithRelationInput[] = [
  { publicadaEn: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
];

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RegistroCatalogo = Prisma.PropiedadGetPayload<{ select: typeof SELECCION_CATALOGO }>;

/**
 * Adaptador de solo lectura del `PropiedadCatalogoRepositoryPort`. Lee la tabla `propiedades`
 * (aggregate cuyo dueño de escritura es `admin-propiedades`) para proyectar las tarjetas públicas.
 *
 * DESVIACIÓN (CORE-006): accede directamente a la tabla en lugar de consumir un query-port de
 * `admin-propiedades` (que aún no existe). Se acota a una proyección `select` de solo lectura y
 * SIEMPRE impone la visibilidad pública (RN-005). Mismo precedente que `PropiedadAccesoPrismaAdapter`
 * de `admin-multimedia`. Cuando `admin-propiedades` publique su `PropiedadQueryPort`, delegar en él.
 */
@Injectable()
export class PropiedadCatalogoPrismaRepository implements PropiedadCatalogoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(filtro: FiltroBusquedaCatalogo): Promise<ResultadoBusquedaCatalogo> {
    const where = this.construirWhereBusqueda(filtro);

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.propiedad.findMany({
        where,
        select: SELECCION_CATALOGO,
        orderBy: ORDEN_RECENCIA,
        skip: filtro.skip,
        take: filtro.take,
      }),
      this.prisma.propiedad.count({ where }),
    ]);

    return { items: registros.map((registro) => this.aReadModel(registro)), total };
  }

  async listarDestacadas(limite: number): Promise<PropiedadCatalogo[]> {
    const registros = await this.prisma.propiedad.findMany({
      where: { ...this.whereVisibilidad(), destacada: true },
      select: SELECCION_CATALOGO,
      orderBy: ORDEN_RECENCIA,
      take: limite,
    });
    return registros.map((registro) => this.aReadModel(registro));
  }

  async listarRecientesDisponibles(
    limite: number,
    excluirIds: string[],
  ): Promise<PropiedadCatalogo[]> {
    const registros = await this.prisma.propiedad.findMany({
      where: {
        archivada: false,
        estado: "disponible",
        ...(excluirIds.length > 0 ? { id: { notIn: excluirIds } } : {}),
      },
      select: SELECCION_CATALOGO,
      orderBy: ORDEN_RECENCIA,
      take: limite,
    });
    return registros.map((registro) => this.aReadModel(registro));
  }

  async listarTiposPropiedadActivos(): Promise<TipoPropiedadPublico[]> {
    const registros = await this.prisma.tipoPropiedad.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });
    return registros.map((registro) => ({ id: registro.id, nombre: registro.nombre }));
  }

  async listarCiudadesConVisibles(): Promise<CiudadConteo[]> {
    const grupos = await this.prisma.propiedad.groupBy({
      by: ["ciudad"],
      where: this.whereVisibilidad(),
      _count: { _all: true },
      orderBy: { ciudad: "asc" },
    });
    return grupos.map((grupo) => ({ ciudad: grupo.ciudad, total: grupo._count._all }));
  }

  /** Visibilidad pública inviolable (RN-005): estados visibles y no archivada. */
  private whereVisibilidad(): Prisma.PropiedadWhereInput {
    return {
      archivada: false,
      estado: { in: [...ESTADOS_VISIBLES_PUBLICO] },
    };
  }

  private construirWhereBusqueda(filtro: FiltroBusquedaCatalogo): Prisma.PropiedadWhereInput {
    const where: Prisma.PropiedadWhereInput = { ...this.whereVisibilidad() };

    if (filtro.tipoOperacion) {
      where.tipoOperacion = filtro.tipoOperacion;
    }
    if (filtro.tipoPropiedad) {
      // El contrato admite "slug o id"; como el modelo no tiene slug, se resuelve por id (UUID) o
      // por nombre del tipo (case-insensitive). Ver CLAUDE.md — desviación acotada de DESIGN-029.
      where.tipoPropiedad = REGEX_UUID.test(filtro.tipoPropiedad)
        ? { id: filtro.tipoPropiedad }
        : { nombre: { equals: filtro.tipoPropiedad, mode: "insensitive" } };
    }
    if (filtro.ciudad) {
      where.ciudad = { equals: filtro.ciudad, mode: "insensitive" };
    }
    if (filtro.barrio) {
      where.barrio = { equals: filtro.barrio, mode: "insensitive" };
    }
    if (filtro.q) {
      where.OR = [
        { titulo: { contains: filtro.q, mode: "insensitive" } },
        { barrio: { contains: filtro.q, mode: "insensitive" } },
        { ciudad: { contains: filtro.q, mode: "insensitive" } },
      ];
    }
    const precio = this.construirRangoPrecio(filtro);
    if (precio) {
      where.precio = precio;
    }

    return where;
  }

  private construirRangoPrecio(
    filtro: FiltroBusquedaCatalogo,
  ): Prisma.BigIntFilter | undefined {
    const rango: Prisma.BigIntFilter = {};
    if (filtro.precioMin !== undefined) {
      rango.gte = BigInt(filtro.precioMin);
    }
    if (filtro.precioMax !== undefined) {
      rango.lte = BigInt(filtro.precioMax);
    }
    return Object.keys(rango).length > 0 ? rango : undefined;
  }

  private aReadModel(registro: RegistroCatalogo): PropiedadCatalogo {
    return {
      id: registro.id,
      codigo: registro.codigo,
      titulo: registro.titulo,
      slug: registro.slug,
      tipoOperacion: registro.tipoOperacion as TipoOperacion,
      tipoPropiedadNombre: registro.tipoPropiedad.nombre,
      ciudad: registro.ciudad,
      barrio: registro.barrio,
      precio: Number(registro.precio),
      area: registro.area,
      habitaciones: registro.habitaciones,
      banos: registro.banos,
      // El `where` de visibilidad garantiza que el estado sólo puede ser disponible o reservada.
      estado: registro.estado as EstadoVisiblePublico,
      destacada: registro.destacada,
      publicadaEn: registro.publicadaEn,
      createdAt: registro.createdAt,
    };
  }
}
