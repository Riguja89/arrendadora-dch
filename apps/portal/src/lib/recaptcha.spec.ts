import { describe, expect, it } from "vitest";
import { estaRecaptchaConfigurado } from "./recaptcha";

/**
 * Solo cubre la lógica pura de configuración (ADR-007). `cargarScriptRecaptcha` /
 * `ejecutarRecaptcha` dependen de `window`/`document` (script real de Google) y se ejercitan
 * manualmente en el navegador — el entorno de test corre en Node sin DOM (ver CLAUDE.md del
 * portal, "Pendiente").
 */
describe("estaRecaptchaConfigurado (degradación anti-bot RN-003)", () => {
  it("es false sin site key", () => {
    expect(estaRecaptchaConfigurado(undefined)).toBe(false);
    expect(estaRecaptchaConfigurado("")).toBe(false);
    expect(estaRecaptchaConfigurado("   ")).toBe(false);
  });

  it("es true con una site key no vacía", () => {
    expect(estaRecaptchaConfigurado("site-key-123")).toBe(true);
  });
});
