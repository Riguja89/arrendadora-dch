import { describe, expect, it } from "vitest";
import {
  construirEnlaceEmail,
  construirEnlaceFacebook,
  construirEnlaceInstagram,
  construirEnlaceTelefono,
  construirEnlaceWhatsapp,
  MENSAJE_WHATSAPP_LANDING,
} from "./contacto-config";

/**
 * Unit tests de la lógica pura de enlaces de contacto de la landing (BUILD-043,
 * HU-L03). Sin dependencias de React ni del DOM — `environment: node`.
 */
describe("construirEnlaceWhatsapp", () => {
  it("antepone el indicativo 57 y codifica el mensaje prellenado", () => {
    const url = construirEnlaceWhatsapp("3001234567", "Hola mundo");
    expect(url).toBe("https://wa.me/573001234567?text=Hola%20mundo");
  });

  it("usa el mensaje prellenado de la landing por defecto", () => {
    const url = construirEnlaceWhatsapp("3001234567");
    expect(url).toContain(encodeURIComponent(MENSAJE_WHATSAPP_LANDING));
    expect(url.startsWith("https://wa.me/573001234567?text=")).toBe(true);
  });

  it("descarta cualquier símbolo o espacio del número", () => {
    const url = construirEnlaceWhatsapp("+57 300 123 4567", "x");
    // El "+57" del input se colapsa a dígitos y el helper vuelve a anteponer 57.
    expect(url).toBe("https://wa.me/57573001234567?text=x");
  });

  it("codifica tildes y signos del mensaje por defecto (español)", () => {
    const url = construirEnlaceWhatsapp("3001234567");
    expect(url).not.toContain(" ");
    expect(url).toContain("%C3%A1"); // á codificada
  });
});

describe("construirEnlaceTelefono", () => {
  it("construye tel: con indicativo 57 y solo dígitos", () => {
    expect(construirEnlaceTelefono("608 123 4567")).toBe("tel:+576081234567");
  });
});

describe("construirEnlaceEmail", () => {
  it("construye mailto: con el email dado", () => {
    expect(construirEnlaceEmail("hola@dch.com")).toBe("mailto:hola@dch.com");
  });
});

describe("enlaces de redes sociales", () => {
  it("construye la URL de Instagram", () => {
    expect(construirEnlaceInstagram("dch")).toBe("https://instagram.com/dch");
  });

  it("construye la URL de Facebook", () => {
    expect(construirEnlaceFacebook("dch")).toBe("https://facebook.com/dch");
  });
});
