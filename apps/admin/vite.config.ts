import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Config única para dev-server/build (Vite) y tests (Vitest) — patrón recomendado por
 * Vitest cuando ambos comparten el mismo proyecto.
 *
 * `resolve.alias` espeja el `paths` de `tsconfig.json` (`@/*` → `./src/*`) — a diferencia de
 * Next.js, Vite/Rollup no leen el `paths` de tsconfig automáticamente.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
