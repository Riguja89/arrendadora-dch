import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import type { PropiedadDetalleRepositoryPort } from "../../domain/ports/propiedad-detalle.repository.port";
import type { PropiedadDetalle } from "../../domain/read-models/propiedad-detalle.read-model";
import type { EstadoVisiblePublico } from "../../domain/types/estado-visible-publico";
import type { TipoOperacion } from "../../domain/types/tipo-operacion";
import { ESTADOS_VISIBLES_PUBLICO } from "../../domain/rules/visibilidad-publica";

/**
 * Proyección `select` de la tabla `propiedades` para la ficha de detalle. Incluye la descripción,
 * el estrato/parqueaderos, las coordenadas aproximadas (ADR-011) y las amenidades. Deliberadamente
 * NO selecciona `direccion`, `agenteId` ni el historial (privacidad, RN-025/ADR-011).
 */
const SELECCION_DETALLE = {
  id: true,
  codigo: true,
  titulo: true,
  slug: true,
  descripcion: true,
  tipoOperacion: true,
  ciudad: true,
  barrio: true,
  precio: true,
  area: true,
  habitaciones: true,
  banos: true,
  estrato: true,
  parqueaderos: true,
  estado: true,
  latitud: true,
  longitud: true,
  tipoPropiedad: { select: { nombre: true } },
  propiedadAmenidad: {
    select: { cantidad: true, amenidad: { select: { nombre: true } } },
    orderBy: { amenidad: { orden: "asc" } },
  },
} satisfies Prisma.PropiedadSelect;

type RegistroDetalle = Prisma.PropiedadGetPayload<{ select: typeof SELECCION_DETALLE }>;

/**
 * Adaptador de solo lectura del `PropiedadDetalleRepositoryPort`. Lee la tabla `propiedades`
 * (aggregate cuyo dueño de escritura es `admin-propiedades`) para proyectar la ficha pública.
 *
 * DESVIACIÓN (CORE-006): accede directamente a la tabla en lugar de consumir un query-port de
 * `admin-propiedades` (que aún no existe). Se acota a una proyección `select` de solo lectura y
 * SIEMPRE impone la visibilidad pública (RN-025). Mismo precedente que `PropiedadCatalogoPrismaRepository`
 * (portal-catalogo). Cuando `admin-propiedades` publique su `PropiedadQueryPort`, delegar en él.
 */
@Injectable()
export class PropiedadDetallePrismaRepository implements PropiedadDetalleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPorSlug(slug: string): Promise<PropiedadDetalle | null> {
    const registro = await this.prisma.propiedad.findFirst({
      where: {
        slug,
        archivada: false,
        estado: { in: [...ESTADOS_VISIBLES_PUBLICO] },
      },
      select: SELECCION_DETALLE,
    });

    return registro ? this.aReadModel(registro) : null;
  }

  private aReadModel(registro: RegistroDetalle): PropiedadDetalle {
    return {
      id: registro.id,
      codigo: registro.codigo,
      titulo: registro.titulo,
      slug: registro.slug,
      descripcion: registro.descripcion,
      tipoOperacion: registro.tipoOperacion as TipoOperacion,
      tipoPropiedadNombre: registro.tipoPropiedad.nombre,
      ciudad: registro.ciudad,
      barrio: registro.barrio,
      precio: Number(registro.precio),
      area: registro.area,
      habitaciones: registro.habitaciones,
      banos: registro.banos,
      estrato: registro.estrato,
      parqueaderos: registro.parqueaderos,
      // El `where` de visibilidad garantiza que el estado sólo puede ser disponible o reservada.
      estado: registro.estado as EstadoVisiblePublico,
      latitud: registro.latitud === null ? null : Number(registro.latitud),
      longitud: registro.longitud === null ? null : Number(registro.longitud),
      amenidades: registro.propiedadAmenidad.map((relacion) => ({
        nombre: relacion.amenidad.nombre,
        cantidad: relacion.cantidad,
      })),
    };
  }
}
