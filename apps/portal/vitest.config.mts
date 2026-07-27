import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Config de test standalone (no depende del dev-server de Next). Cubre lógica pura de
 * `src/` — los tests de componentes/rutas con render real (jsdom + Testing Library) quedan
 * pendientes, ver nota "Pendiente" en `apps/portal/CLAUDE.md`.
 *
 * `resolve.alias` espeja el `paths` de `tsconfig.json` (`@/* -> ./src/*`) para que los módulos
 * de `src/` puedan importarse con el mismo alias que usa Next.js en tiempo de build.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
