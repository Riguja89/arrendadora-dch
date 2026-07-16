import { describe, expect, it } from "vitest";
import {
  MAX_INTENTOS_FALLIDOS,
  PASSWORD_TEMPORAL_LONGITUD,
  RESET_TOKEN_TTL_MINUTOS,
  SESION_TTL_MINUTOS,
} from "./auth-constantes";

/**
 * Estas constantes son reglas de negocio (GAP-005, GAP-006, RN-019, ADR-004) — el test las fija
 * como contrato explícito para que un cambio accidental de valor se detecte en CI.
 */
describe("auth-constantes", () => {
  it("SESION_TTL_MINUTOS — TTL de sesión deslizante (GAP-005)", () => {
    expect(SESION_TTL_MINUTOS).toBe(30);
  });

  it("MAX_INTENTOS_FALLIDOS — bloqueo permanente tras 5 intentos (GAP-006)", () => {
    expect(MAX_INTENTOS_FALLIDOS).toBe(5);
  });

  it("RESET_TOKEN_TTL_MINUTOS — enlace de recuperación válido 60 minutos (RN-019)", () => {
    expect(RESET_TOKEN_TTL_MINUTOS).toBe(60);
  });

  it("PASSWORD_TEMPORAL_LONGITUD — longitud de la contraseña temporal generada (GAP-004)", () => {
    expect(PASSWORD_TEMPORAL_LONGITUD).toBe(12);
  });
});
