import { describe, expect, it } from "vitest";
import { obtenerPropiedadMockPorSlug, PROPIEDADES_DESTACADAS_MOCK } from "./propiedades";

/**
 * Smoke test de scaffolding — confirma que el mock de propiedades (usado por el placeholder
 * SSR/Open Graph de `app/propiedades/[slug]/page.tsx`) resuelve por slug. Se reemplaza por
 * tests del cliente HTTP real al implementar CU-001 (spec-002).
 */
describe("obtenerPropiedadMockPorSlug (smoke)", () => {
  it("encuentra una propiedad mock por slug existente", () => {
    const [primera] = PROPIEDADES_DESTACADAS_MOCK;
    const encontrada = obtenerPropiedadMockPorSlug(primera.slug);
    expect(encontrada?.codigo).toBe(primera.codigo);
  });

  it("devuelve undefined para un slug inexistente", () => {
    expect(obtenerPropiedadMockPorSlug("slug-que-no-existe")).toBeUndefined();
  });
});
