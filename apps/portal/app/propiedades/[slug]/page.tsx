import type { Metadata } from "next";
import { obtenerPropiedadMockPorSlug } from "@/mocks/propiedades";

interface PaginaPropiedadProps {
  params: Promise<{ slug: string }>;
}

/**
 * Ficha de propiedad — placeholder de scaffolding. Demuestra el patrón SSR + Open Graph
 * exigido por ADR-010 (`generateMetadata` inyecta metadatos por propiedad en el `<head>` para
 * preview de WhatsApp/redes, RN-008) con datos MOCK — sin fetch real a la API todavía
 * (CU-001, spec-002, pendiente de Construir).
 */
export async function generateMetadata({ params }: PaginaPropiedadProps): Promise<Metadata> {
  const { slug } = await params;
  const propiedad = obtenerPropiedadMockPorSlug(slug);

  if (!propiedad) {
    return { title: "Propiedad no encontrada" };
  }

  return {
    title: propiedad.openGraph.titulo,
    description: propiedad.openGraph.descripcion,
    openGraph: {
      title: propiedad.openGraph.titulo,
      description: propiedad.openGraph.descripcion,
      images: [{ url: propiedad.openGraph.imagen }],
      url: propiedad.openGraph.url,
      type: "website",
    },
  };
}

export default async function PaginaPropiedad({ params }: PaginaPropiedadProps) {
  const { slug } = await params;
  const propiedad = obtenerPropiedadMockPorSlug(slug);

  if (!propiedad) {
    return (
      <main className="container">
        <p>Propiedad no encontrada (dato mock — scaffolding).</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>{propiedad.titulo}</h1>
      <p>
        {propiedad.tipoPropiedad} en {propiedad.tipoOperacion} — {propiedad.ciudad},{" "}
        {propiedad.barrio}
      </p>
      <p>{propiedad.descripcion}</p>
      <p>
        {propiedad.habitaciones} habitaciones · {propiedad.banos} baños · {propiedad.area} m²
      </p>
    </main>
  );
}
