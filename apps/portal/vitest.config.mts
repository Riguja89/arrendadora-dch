import { defineConfig } from "vitest/config";

/**
 * Config de test standalone (no depende del dev-server de Next). Cubre lógica pura de
 * `src/` — los tests de componentes/rutas con render real se agregan cuando exista lógica
 * de negocio (CU-001, spec-002).
 */
export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
