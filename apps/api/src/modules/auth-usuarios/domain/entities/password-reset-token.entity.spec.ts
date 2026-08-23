import { describe, expect, it } from "vitest";
import { PasswordResetToken } from "./password-reset-token.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

describe("PasswordResetToken", () => {
  describe("crear", () => {
    it("arranca no usado y calcula expiraEn con el TTL provisto (RN-019)", () => {
      const token = PasswordResetToken.crear({
        id: "token-1",
        usuarioId: "user-1",
        tokenHash: "hash-abc",
        ahora: AHORA,
        ttlMinutos: 60,
      });

      expect(token.usado).toBe(false);
      expect(token.createdAt).toEqual(AHORA);
      expect(token.expiraEn).toEqual(new Date(AHORA.getTime() + 60 * 60_000));
      expect(token.tokenHash).toBe("hash-abc");
    });
  });

  describe("reconstituir", () => {
    it("restaura la instancia con los props provistos", () => {
      const token = PasswordResetToken.reconstituir({
        id: "token-1",
        usuarioId: "user-1",
        tokenHash: "hash-abc",
        expiraEn: AHORA,
        usado: true,
        createdAt: AHORA,
      });

      expect(token.usado).toBe(true);
    });
  });

  describe("esValido", () => {
    it("retorna true cuando no está usado y no ha vencido", () => {
      const token = PasswordResetToken.crear({
        id: "t1",
        usuarioId: "u1",
        tokenHash: "h1",
        ahora: AHORA,
        ttlMinutos: 60,
      });

      const antesDeVencer = new Date(AHORA.getTime() + 59 * 60_000);
      expect(token.esValido(antesDeVencer)).toBe(true);
    });

    it("retorna false cuando ya fue usado, aunque no haya vencido", () => {
      const token = PasswordResetToken.crear({
        id: "t1",
        usuarioId: "u1",
        tokenHash: "h1",
        ahora: AHORA,
        ttlMinutos: 60,
      });
      token.marcarUsado();

      expect(token.esValido(AHORA)).toBe(false);
    });

    it("retorna false exactamente en el instante de expiración (límite estricto)", () => {
      const token = PasswordResetToken.crear({
        id: "t1",
        usuarioId: "u1",
        tokenHash: "h1",
        ahora: AHORA,
        ttlMinutos: 60,
      });

      expect(token.esValido(token.expiraEn)).toBe(false);
    });

    it("retorna false cuando ya venció", () => {
      const token = PasswordResetToken.crear({
        id: "t1",
        usuarioId: "u1",
        tokenHash: "h1",
        ahora: AHORA,
        ttlMinutos: 60,
      });

      const despuesDeVencer = new Date(token.expiraEn.getTime() + 1);
      expect(token.esValido(despuesDeVencer)).toBe(false);
    });
  });

  describe("marcarUsado", () => {
    it("marca el token como usado de forma irreversible dentro de la instancia", () => {
      const token = PasswordResetToken.crear({
        id: "t1",
        usuarioId: "u1",
        tokenHash: "h1",
        ahora: AHORA,
        ttlMinutos: 60,
      });

      token.marcarUsado();

      expect(token.usado).toBe(true);
    });
  });
});
