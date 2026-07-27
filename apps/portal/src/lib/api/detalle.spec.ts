import { beforeEach, describe, expect, it, vi } from "vitest";
import { peticionApi, peticionApiPost } from "@/lib/http-client";
import {
  aPropiedadDetalle,
  generarContactoWhatsapp,
  mensajeErrorContacto,
  obtenerFichaPorSlug,
  type PropiedadDetalleWire,
} from "./detalle";

vi.mock("@/lib/http-client", () => ({
  peticionApi: vi.fn(),
  peticionApiPost: vi.fn(),
}));

const peticionApiMock = vi.mocked(peticionApi);
const peticionApiPostMock = vi.mocked(peticionApiPost);

const FICHA_WIRE: PropiedadDetalleWire = {
  codigo: "AP-001",
  titulo: "Apartamento moderno cerca al centro de Yopal",
  slug: "ap-001-apartamento-moderno-yopal",
  descripcion: "Amplio apartamento con vista a la ciudad.",
  tipo_operacion: "arriendo",
  tipo_propiedad: "Apartamento",
  ciudad: "Yopal",
  barrio: "La Campiña",
  precio: 1_600_000,
  area: 68,
  habitaciones: 3,
  banos: 2,
  estrato: 3,
  parqueaderos: 1,
  estado: "disponible",
  badge_reservada: false,
  amenidades: [{ nombre: "Parqueadero", cantidad: 1 }],
  galeria: [
    {
      url_optimizada: "https://cdn.example.com/foto-2.jpg",
      url_card: "https://cdn.example.com/foto-2-card.jpg",
      url_thumbnail: "https://cdn.example.com/foto-2-thumb.jpg",
      es_portada: false,
    },
    {
      url_optimizada: "https://cdn.example.com/foto-1-portada.jpg",
      url_card: "https://cdn.example.com/foto-1-portada-card.jpg",
      url_thumbnail: "https://cdn.example.com/foto-1-portada-thumb.jpg",
      es_portada: true,
    },
  ],
  ubicacion: { latitud: 5.33, longitud: -72.4 },
  open_graph: {
    titulo: "Apartamento en Yopal",
    descripcion: "Arriendo — Yopal, La Campiña.",
    imagen: "https://cdn.example.com/foto-1-portada.jpg",
    url: "https://arrendadora.example.com/propiedades/ap-001-apartamento-moderno-yopal",
  },
};

describe("aPropiedadDetalle", () => {
  it("mapea el wire snake_case al modelo de dominio camelCase", () => {
    const propiedad = aPropiedadDetalle(FICHA_WIRE);

    expect(propiedad.codigo).toBe("AP-001");
    expect(propiedad.tipoOperacion).toBe("arriendo");
    expect(propiedad.badgeReservada).toBe(false);
    expect(propiedad.estrato).toBe(3);
    expect(propiedad.parqueaderos).toBe(1);
    expect(propiedad.ubicacion).toEqual({ latitud: 5.33, longitud: -72.4 });
    expect(propiedad.openGraph).toEqual({
      titulo: "Apartamento en Yopal",
      descripcion: "Arriendo — Yopal, La Campiña.",
      imagen: "https://cdn.example.com/foto-1-portada.jpg",
      url: "https://arrendadora.example.com/propiedades/ap-001-apartamento-moderno-yopal",
    });
  });

  it("reordena la galería para que la foto de portada quede primero (HU-001 escenario 1)", () => {
    const propiedad = aPropiedadDetalle(FICHA_WIRE);

    expect(propiedad.galeria[0]?.esPortada).toBe(true);
    expect(propiedad.galeria[0]?.urlOptimizada).toBe("https://cdn.example.com/foto-1-portada.jpg");
    expect(propiedad.galeria[1]?.esPortada).toBe(false);
  });

  it("mapea `ubicacion: null` cuando la propiedad no tiene coordenadas (ADR-011)", () => {
    const propiedad = aPropiedadDetalle({ ...FICHA_WIRE, ubicacion: null });
    expect(propiedad.ubicacion).toBeNull();
  });
});

describe("obtenerFichaPorSlug", () => {
  beforeEach(() => {
    peticionApiMock.mockReset();
  });

  it("llama al endpoint de detalle con el slug codificado y mapea la respuesta", async () => {
    peticionApiMock.mockResolvedValue({ ok: true, data: FICHA_WIRE });

    const resultado = await obtenerFichaPorSlug("ap-001-apartamento-moderno-yopal");

    expect(peticionApiMock).toHaveBeenCalledWith(
      "/public/propiedades/ap-001-apartamento-moderno-yopal",
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.data.slug).toBe("ap-001-apartamento-moderno-yopal");
    }
  });

  it("propaga el error (404 NOT_FOUND) tal cual cuando la propiedad no es visible (RN-025)", async () => {
    peticionApiMock.mockResolvedValue({
      ok: false,
      error: { error: "NOT_FOUND", message: "La propiedad solicitada no está disponible.", correlation_id: "id-1" },
    });

    const resultado = await obtenerFichaPorSlug("slug-inexistente");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.error).toBe("NOT_FOUND");
    }
  });
});

describe("generarContactoWhatsapp", () => {
  beforeEach(() => {
    peticionApiPostMock.mockReset();
  });

  it("envía el token de reCAPTCHA y mapea `deep_link` a `deepLink`", async () => {
    peticionApiPostMock.mockResolvedValue({
      ok: true,
      data: { deep_link: "https://wa.me/573001234567?text=Hola" },
    });

    const resultado = await generarContactoWhatsapp("ap-001-apartamento-moderno-yopal", "token-123");

    expect(peticionApiPostMock).toHaveBeenCalledWith(
      "/public/propiedades/ap-001-apartamento-moderno-yopal/contacto-whatsapp",
      { recaptcha_token: "token-123" },
    );
    expect(resultado).toEqual({ ok: true, data: { deepLink: "https://wa.me/573001234567?text=Hola" } });
  });

  it("propaga el error 403 (anti-bot rechazó la solicitud, ADR-007) tal cual", async () => {
    peticionApiPostMock.mockResolvedValue({
      ok: false,
      error: { error: "FORBIDDEN", message: "No pudimos validar tu solicitud.", correlation_id: "id-2" },
    });

    const resultado = await generarContactoWhatsapp("ap-001", "token-rechazado");
    expect(resultado.ok).toBe(false);
  });
});

describe("mensajeErrorContacto (RN-003, degradación anti-bot)", () => {
  it("usa el mensaje exacto de RN-003 cuando el anti-bot no está disponible (503)", () => {
    expect(
      mensajeErrorContacto({ error: "SERVICE_UNAVAILABLE", message: "x", correlation_id: "id" }),
    ).toBe("En este momento no podemos validar tu solicitud. Intentá de nuevo en unos minutos.");
  });

  it("usa un mensaje de rechazo sin detalles técnicos cuando el anti-bot bloquea (403)", () => {
    const mensaje = mensajeErrorContacto({ error: "FORBIDDEN", message: "x", correlation_id: "id" });
    expect(mensaje).toBe("No pudimos validar tu solicitud. Por favor intentá de nuevo.");
  });

  it("usa un mensaje genérico para errores no mapeados explícitamente", () => {
    expect(
      mensajeErrorContacto({ error: "INTERNAL_ERROR", message: "x", correlation_id: "id" }),
    ).toBe("Ocurrió un error inesperado. Intentá de nuevo en unos minutos.");
  });
});
