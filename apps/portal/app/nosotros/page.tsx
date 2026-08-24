import type { Metadata } from "next";
import type { PropiedadResumen } from "@arrendadora/shared";
import {
  listarCiudades,
  listarDestacadas,
  listarTiposPropiedad,
  type CiudadConteoWire,
  type TipoPropiedadPublicoWire,
} from "@/lib/api/catalogo";
import { HeroLanding } from "@/components/landing/hero-landing";
import { SobreNosotros } from "@/components/landing/sobre-nosotros";
import { ServiciosGrid } from "@/components/landing/servicios-grid";
import { Diferenciales } from "@/components/landing/diferenciales";
import { DestacadasLanding } from "@/components/landing/destacadas-landing";
import { MiniFiltroLanding } from "@/components/landing/mini-filtro-landing";
import { ContactoDirecto } from "@/components/landing/contacto-directo";

/**
 * Landing institucional `/nosotros` (BUILD-043, HU-L01..L05). El catálogo (`/`)
 * sigue siendo la home canónica; esta página tiene metadata propia e indexable
 * (RN-L06).
 */
export const metadata: Metadata = {
  title: "Nosotros — Servicios inmobiliarios en Yopal y Aguazul",
  description:
    "Conoce a D-CH Inmobiliaria: tu aliado en compra, venta, arriendo y avalúos de propiedades en Yopal y Aguazul, Casanare.",
};

export default async function NosotrosPage() {
  // Degradación graciosa (RN-L04): si cualquier catálogo falla, se usa una lista
  // vacía. La landing renderiza igual; los selects quedan vacíos y las destacadas
  // muestran el estado de cortesía.
  const [respuestaDestacadas, respuestaTipos, respuestaCiudades] = await Promise.all([
    listarDestacadas(),
    listarTiposPropiedad(),
    listarCiudades(),
  ]);

  const destacadas: PropiedadResumen[] = respuestaDestacadas.ok ? respuestaDestacadas.data : [];
  const tiposPropiedad: TipoPropiedadPublicoWire[] = respuestaTipos.ok ? respuestaTipos.data : [];
  const ciudades: CiudadConteoWire[] = respuestaCiudades.ok ? respuestaCiudades.data : [];

  return (
    <main className="landing">
      <HeroLanding />
      <SobreNosotros />
      <ServiciosGrid />
      <Diferenciales />
      <DestacadasLanding propiedades={destacadas} />
      <MiniFiltroLanding tiposPropiedad={tiposPropiedad} ciudades={ciudades} />
      <ContactoDirecto />
    </main>
  );
}
