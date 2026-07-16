import { describe, expect, it } from "vitest";
import { Sesion } from "./sesion.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

describe("Sesion", () => {
  describe("crear", () => {
    it("calcula expiraEn sumando el TTL en minutos a la fecha de creación", () => {
      const sesion = Sesion.crear({
        id: "sesion-1",
        usuarioId: "user-1",
        ip: "10.0.0.1",
        userAgent: "vitest",
        ahora: AHORA,
        ttlMinutos: 30,
      });

      expect(sesion.createdAt).toEqual(AHORA);
      expect(sesion.expiraEn).toEqual(new Date(AHORA.getTime() + 30 * 60_000));
      expect(sesion.ip).toBe("10.0.0.1");
      expect(sesion.userAgent).toBe("vitest");
    });
  });

  describe("reconstituir", () => {
    it("restaura la instancia con los props provistos", () => {
      const expiraEn = new Date(AHORA.getTime() + 60_000);
      const sesion = Sesion.reconstituir({
        id: "sesion-1",
        usuarioId: "user-1",
        expiraEn,
        ip: null,
        userAgent: null,
        createdAt: AHORA,
      });

      expect(sesion.id).toBe("sesion-1");
      expect(sesion.expiraEn).toEqual(expiraEn);
    });
  });

  describe("estaExpirada", () => {
    it("retorna false cuando la fecha actual es anterior a expiraEn", () => {
      const sesion = Sesion.crear({
        id: "s1",
        usuarioId: "u1",
        ip: null,
        userAgent: null,
        ahora: AHORA,
        ttlMinutos: 30,
      });

      const antesDeExpirar = new Date(AHORA.getTime() + 29 * 60_000);
      expect(sesion.estaExpirada(antesDeExpirar)).toBe(false);
    });

    it("retorna true exactamente en el instante de expiración (límite inclusivo)", () => {
      const sesion = Sesion.crear({
        id: "s1",
        usuarioId: "u1",
        ip: null,
        userAgent: null,
        ahora: AHORA,
        ttlMinutos: 30,
      });

      expect(sesion.estaExpirada(sesion.expiraEn)).toBe(true);
    });

    it("retorna true cuando la fecha actual es posterior a expiraEn", () => {
      const sesion = Sesion.crear({
        id: "s1",
        usuarioId: "u1",
        ip: null,
        userAgent: null,
        ahora: AHORA,
        ttlMinutos: 30,
      });

      const despuesDeExpirar = new Date(sesion.expiraEn.getTime() + 1);
      expect(sesion.estaExpirada(despuesDeExpirar)).toBe(true);
    });
  });

  describe("renovar", () => {
    it("recalcula expiraEn desde la nueva fecha (sliding TTL, GAP-005)", () => {
      const sesion = Sesion.crear({
        id: "s1",
        usuarioId: "u1",
        ip: null,
        userAgent: null,
        ahora: AHORA,
        ttlMinutos: 30,
      });

      const nuevaAhora = new Date(AHORA.getTime() + 10 * 60_000);
      sesion.renovar(nuevaAhora, 30);

      expect(sesion.expiraEn).toEqual(new Date(nuevaAhora.getTime() + 30 * 60_000));
    });
  });
});
