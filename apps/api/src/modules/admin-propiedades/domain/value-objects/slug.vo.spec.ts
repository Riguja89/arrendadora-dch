import { describe, expect, it } from "vitest";
import { Slug } from "./slug.vo";

/** RN-007 — slug estable derivado del título + código, sin tildes ni caracteres especiales. */
describe("Slug (VO)", () => {
  it("normaliza a minúsculas, sin tildes y separado por guiones", () => {
    expect(Slug.normalizar("Apartamento en Chapinero Ñandú")).toBe("apartamento-en-chapinero-nandu");
  });

  it("colapsa separadores repetidos y recorta guiones de los extremos", () => {
    expect(Slug.normalizar("  Casa --- Grande!!  ")).toBe("casa-grande");
  });

  it("combina título y código en el slug final", () => {
    expect(Slug.desdeTitulo("Apartamento en Chapinero", "AP-001").valor).toBe(
      "apartamento-en-chapinero-ap-001",
    );
  });

  it("usa solo el código cuando el título queda vacío tras normalizar", () => {
    expect(Slug.desdeTitulo("!!!", "AP-002").valor).toBe("ap-002");
  });

  it("reconstituye un slug persistido sin transformarlo", () => {
    expect(Slug.reconstituir("casa-en-envigado-ap-003").valor).toBe("casa-en-envigado-ap-003");
  });
});
