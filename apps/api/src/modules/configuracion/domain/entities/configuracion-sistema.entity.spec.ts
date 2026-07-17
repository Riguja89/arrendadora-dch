import { describe, expect, it } from "vitest";
import { ConfiguracionSistema } from "./configuracion-sistema.entity";
import {
  ImagenGenericaUrlInvalidaError,
  NombreInmobiliariaInvalidoError,
  NumeroWhatsappInvalidoError,
  PlantillaMensajeInvalidaError,
} from "../errors/dominio-configuracion.errors";
import { CONFIGURACION_SINGLETON_ID } from "../rules/configuracion-constantes";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const DESPUES = new Date("2026-07-02T12:00:00.000Z");

const DATOS_VALIDOS = {
  whatsappNumeroCentral: "+57 300 123 4567",
  whatsappPlantillaMensaje: "Hola, me interesa la propiedad {codigo}.",
  nombreInmobiliaria: "Inmobiliaria Central",
  imagenGenericaUrl: "https://cdn.arrendadora.com/generica.jpg",
  actualizadaPor: "admin-1",
};

function baseSemilla(): ConfiguracionSistema {
  return ConfiguracionSistema.crearPorDefecto({ id: CONFIGURACION_SINGLETON_ID, ahora: AHORA });
}

describe("ConfiguracionSistema", () => {
  it("crearPorDefecto siembra el singleton con valores válidos y sin auditoría de actor", () => {
    const config = baseSemilla();
    const props = config.toProps();

    expect(props.id).toBe(CONFIGURACION_SINGLETON_ID);
    expect(props.actualizadaPor).toBeNull();
    expect(props.updatedAt).toEqual(AHORA);
    expect(props.whatsappPlantillaMensaje).toContain("{codigo}");
    // La semilla pasa por la misma validación que una actualización real → no lanza.
    expect(props.nombreInmobiliaria.length).toBeGreaterThan(0);
  });

  it("actualizar aplica los campos editables, registra el actor y toca updatedAt", () => {
    const config = baseSemilla();

    config.actualizar(DATOS_VALIDOS, DESPUES);
    const props = config.toProps();

    expect(props.whatsappNumeroCentral).toBe("+57 300 123 4567");
    expect(props.whatsappPlantillaMensaje).toBe("Hola, me interesa la propiedad {codigo}.");
    expect(props.nombreInmobiliaria).toBe("Inmobiliaria Central");
    expect(props.imagenGenericaUrl).toBe("https://cdn.arrendadora.com/generica.jpg");
    expect(props.actualizadaPor).toBe("admin-1");
    expect(props.updatedAt).toEqual(DESPUES);
  });

  it("actualizar recorta el nombre y lo rechaza si queda vacío (RN-014)", () => {
    const config = baseSemilla();
    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, nombreInmobiliaria: "   " }, DESPUES),
    ).toThrow(NombreInmobiliariaInvalidoError);
  });

  it("actualizar rechaza un número de WhatsApp inválido (ADR-012)", () => {
    const config = baseSemilla();
    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, whatsappNumeroCentral: "no-es-numero" }, DESPUES),
    ).toThrow(NumeroWhatsappInvalidoError);
  });

  it("actualizar rechaza una plantilla con marcador no permitido (GAP-002)", () => {
    const config = baseSemilla();
    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, whatsappPlantillaMensaje: "Hola {telefono}" }, DESPUES),
    ).toThrow(PlantillaMensajeInvalidaError);
  });

  it("actualizar rechaza una URL de imagen que no es http(s) (RN-008)", () => {
    const config = baseSemilla();
    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, imagenGenericaUrl: "ftp://x/y.png" }, DESPUES),
    ).toThrow(ImagenGenericaUrlInvalidaError);
    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, imagenGenericaUrl: "no-es-url" }, DESPUES),
    ).toThrow(ImagenGenericaUrlInvalidaError);
  });

  it("una actualización fallida no muta el estado previo (validación atómica)", () => {
    const config = baseSemilla();
    config.actualizar(DATOS_VALIDOS, DESPUES);

    expect(() =>
      config.actualizar({ ...DATOS_VALIDOS, whatsappNumeroCentral: "abc" }, AHORA),
    ).toThrow(NumeroWhatsappInvalidoError);

    // El número válido previo se conserva: la validación ocurre antes de mutar props.
    expect(config.toProps().whatsappNumeroCentral).toBe("+57 300 123 4567");
    expect(config.toProps().updatedAt).toEqual(DESPUES);
  });

  it("reconstituir no revalida invariantes (reconstrucción desde persistencia)", () => {
    const config = ConfiguracionSistema.reconstituir({
      id: CONFIGURACION_SINGLETON_ID,
      whatsappNumeroCentral: "guardado-crudo",
      whatsappPlantillaMensaje: "{cualquier-cosa}",
      nombreInmobiliaria: "",
      imagenGenericaUrl: "valor-persistido",
      actualizadaPor: null,
      updatedAt: AHORA,
    });
    expect(config.whatsappNumeroCentral).toBe("guardado-crudo");
  });
});
