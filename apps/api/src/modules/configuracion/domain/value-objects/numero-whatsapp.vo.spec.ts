import { describe, expect, it } from "vitest";
import { NumeroWhatsapp } from "./numero-whatsapp.vo";
import { NumeroWhatsappInvalidoError } from "../errors/dominio-configuracion.errors";

describe("NumeroWhatsapp", () => {
  it("acepta un número colombiano con indicativo de país y espacios (ADR-012)", () => {
    const numero = NumeroWhatsapp.crear("+57 300 123 4567");
    expect(numero.valor).toBe("+57 300 123 4567");
  });

  it("acepta un número local de 10 dígitos", () => {
    expect(NumeroWhatsapp.crear("3001234567").valor).toBe("3001234567");
  });

  it("normaliza espacios múltiples y recorta extremos", () => {
    expect(NumeroWhatsapp.crear("  +57   300  1234567  ").valor).toBe("+57 300 1234567");
  });

  it("rechaza un número vacío", () => {
    expect(() => NumeroWhatsapp.crear("   ")).toThrow(NumeroWhatsappInvalidoError);
  });

  it("rechaza un número con letras", () => {
    expect(() => NumeroWhatsapp.crear("300 ABC 4567")).toThrow(NumeroWhatsappInvalidoError);
  });

  it("rechaza un número con menos de 10 dígitos", () => {
    expect(() => NumeroWhatsapp.crear("+57 300 12")).toThrow(NumeroWhatsappInvalidoError);
  });

  it("rechaza un número con más de 13 dígitos", () => {
    expect(() => NumeroWhatsapp.crear("+57 300 123 4567 890")).toThrow(NumeroWhatsappInvalidoError);
  });
});
