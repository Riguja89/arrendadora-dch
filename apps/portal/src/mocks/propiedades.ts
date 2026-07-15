import type { PropiedadDetalle, PropiedadResumen } from "@arrendadora/shared";

/**
 * Datos mock del scaffolding — SIN fetch real a la API. Se reemplazan por el cliente HTTP
 * (`src/lib/http-client.ts`) al implementar CU-001 (spec-002, catálogo/detalle público).
 *
 * Nota de ruta: ADR-010 define `/propiedades/{operacion}/{slug}` como URL de producción; este
 * scaffolding usa un único segmento dinámico `[slug]` (ver `app/propiedades/[slug]/page.tsx`)
 * y conserva `tipoOperacion` como campo del objeto — se ajusta al implementar CU-001.
 */
export const PROPIEDADES_DESTACADAS_MOCK: PropiedadResumen[] = [
  {
    codigo: "AP-001",
    titulo: "Apartamento moderno cerca al centro de Yopal",
    slug: "ap-001-apartamento-moderno-yopal",
    tipoOperacion: "arriendo",
    tipoPropiedad: "Apartamento",
    ciudad: "Yopal",
    barrio: "La Campiña",
    precio: 1_600_000,
    area: 68,
    habitaciones: 3,
    banos: 2,
    estado: "disponible",
    badgeReservada: false,
    portadaUrl: "https://via.placeholder.com/640x400?text=Apartamento+AP-001",
  },
  {
    codigo: "CA-014",
    titulo: "Casa campestre en Aguazul con amplio patio",
    slug: "ca-014-casa-campestre-aguazul",
    tipoOperacion: "venta",
    tipoPropiedad: "Casa",
    ciudad: "Aguazul",
    barrio: "Villa del Río",
    precio: 285_000_000,
    area: 180,
    habitaciones: 4,
    banos: 3,
    estado: "reservada",
    badgeReservada: true,
    portadaUrl: "https://via.placeholder.com/640x400?text=Casa+CA-014",
  },
];

export const PROPIEDADES_DETALLE_MOCK: PropiedadDetalle[] = PROPIEDADES_DESTACADAS_MOCK.map(
  (resumen) => ({
    ...resumen,
    descripcion: `Descripción mock de "${resumen.titulo}". Contenido real pendiente de CU-001 (spec-002).`,
    estrato: 3,
    parqueaderos: 1,
    amenidades: [{ nombre: "Parqueadero", cantidad: 1 }],
    galeria: [
      {
        urlOptimizada: resumen.portadaUrl,
        urlCard: resumen.portadaUrl,
        urlThumbnail: resumen.portadaUrl,
        esPortada: true,
      },
    ],
    ubicacion: null,
    openGraph: {
      titulo: resumen.titulo,
      descripcion: `${resumen.tipoPropiedad} en ${resumen.tipoOperacion} — ${resumen.ciudad}, ${resumen.barrio}.`,
      imagen: resumen.portadaUrl,
      url: `https://arrendadora.example.com/propiedades/${resumen.slug}`,
    },
  }),
);

export function obtenerPropiedadMockPorSlug(slug: string): PropiedadDetalle | undefined {
  return PROPIEDADES_DETALLE_MOCK.find((propiedad) => propiedad.slug === slug);
}
