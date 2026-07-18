import { describe, expect, it, vi } from "vitest";
import { GenerarContactoWhatsappUseCase } from "./generar-contacto-whatsapp.use-case";
import {
  ContactoRechazadoError,
  PropiedadNoEncontradaError,
  ServicioAntibotNoDisponibleError,
} from "../../domain/errors/dominio-detalle.errors";
import type { PropiedadDetalleRepositoryPort } from "../../domain/ports/propiedad-detalle.repository.port";
import type { PropiedadDetalle } from "../../domain/read-models/propiedad-detalle.read-model";
import type {
  ResultadoAntibot,
  VerificadorAntibotPort,
} from "../../domain/ports/verificador-antibot.port";
import type { ConfiguracionQueryPort } from "../../../configuracion/domain/ports/configuracion-query.port";

function propiedad(): PropiedadDetalle {
  return {
    id: "prop-1",
    codigo: "AP-001",
    titulo: "Apartamento en Chapinero",
    slug: "apartamento-chapinero",
    descripcion: "Amplio apartamento.",
    tipoOperacion: "arriendo",
    tipoPropiedadNombre: "Apartamento",
    ciudad: "Bogotá",
    barrio: "Chapinero",
    precio: 2_800_000,
    area: 75,
    habitaciones: 3,
    banos: 2,
    estrato: 4,
    parqueaderos: 1,
    estado: "disponible",
    latitud: null,
    longitud: null,
    amenidades: [],
  };
}

function buildDeps(prop: PropiedadDetalle | null, resultadoAntibot: ResultadoAntibot) {
  const propiedades = {
    obtenerPorSlug: vi.fn().mockResolvedValue(prop),
  } as unknown as PropiedadDetalleRepositoryPort;
  const antibot = {
    verificar: vi.fn().mockResolvedValue(resultadoAntibot),
  } as unknown as VerificadorAntibotPort;
  const configuracion = {
    obtenerConfiguracionPublica: vi.fn().mockResolvedValue({
      whatsappNumeroCentral: "+57 300 123 4567",
      whatsappPlantillaMensaje: "Hola, me interesa la propiedad {codigo}.",
      nombreInmobiliaria: "Arrendadora",
      imagenGenericaUrl: "https://cdn/generica.jpg",
    }),
  } as unknown as ConfiguracionQueryPort;
  return { propiedades, antibot, configuracion };
}

const APROBADO: ResultadoAntibot = { disponible: true, aprobado: true, score: 0.9 };

describe("GenerarContactoWhatsappUseCase", () => {
  it("genera el deep link con el número central cuando el anti-bot aprueba (CU-002, ADR-012)", async () => {
    const deps = buildDeps(propiedad(), APROBADO);
    const uc = new GenerarContactoWhatsappUseCase(deps.propiedades, deps.antibot, deps.configuracion);

    const resultado = await uc.ejecutar({ slug: "apartamento-chapinero", recaptchaToken: "tok" });

    expect(deps.antibot.verificar).toHaveBeenCalledWith("tok");
    expect(resultado.deepLink).toBe(
      "https://wa.me/573001234567?text=Hola%2C%20me%20interesa%20la%20propiedad%20AP-001.",
    );
  });

  it("lanza 404 cuando la propiedad no es visible, sin invocar el anti-bot (RN-025)", async () => {
    const deps = buildDeps(null, APROBADO);
    const uc = new GenerarContactoWhatsappUseCase(deps.propiedades, deps.antibot, deps.configuracion);

    await expect(
      uc.ejecutar({ slug: "inexistente", recaptchaToken: "tok" }),
    ).rejects.toBeInstanceOf(PropiedadNoEncontradaError);
    expect(deps.antibot.verificar).not.toHaveBeenCalled();
  });

  it("lanza 503 cuando el anti-bot no está disponible, sin generar enlace (RN-003)", async () => {
    const deps = buildDeps(propiedad(), { disponible: false, aprobado: false, score: null });
    const uc = new GenerarContactoWhatsappUseCase(deps.propiedades, deps.antibot, deps.configuracion);

    await expect(
      uc.ejecutar({ slug: "apartamento-chapinero", recaptchaToken: "tok" }),
    ).rejects.toBeInstanceOf(ServicioAntibotNoDisponibleError);
    expect(deps.configuracion.obtenerConfiguracionPublica).not.toHaveBeenCalled();
  });

  it("lanza 403 cuando el anti-bot rechaza por score bajo (probable bot, ADR-007)", async () => {
    const deps = buildDeps(propiedad(), { disponible: true, aprobado: false, score: 0.1 });
    const uc = new GenerarContactoWhatsappUseCase(deps.propiedades, deps.antibot, deps.configuracion);

    await expect(
      uc.ejecutar({ slug: "apartamento-chapinero", recaptchaToken: "tok" }),
    ).rejects.toBeInstanceOf(ContactoRechazadoError);
    expect(deps.configuracion.obtenerConfiguracionPublica).not.toHaveBeenCalled();
  });
});
