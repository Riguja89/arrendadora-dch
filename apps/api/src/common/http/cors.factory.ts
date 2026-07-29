import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * Construye las `CorsOptions` globales de la API. Extraído de `main.ts` para que las pruebas de
 * integración ejerciten EXACTAMENTE la misma configuración (mismos orígenes permitidos, mismas
 * credenciales) sin riesgo de drift entre el bootstrap real y el harness de test — mismo patrón
 * que `crearValidationPipe` (`validation-pipe.factory.ts`).
 *
 * El panel admin (`PANEL_URL`) y el portal público (`PORTAL_URL`) son SPAs cross-origin respecto
 * a esta API (`ADR-004`: login por cookie de sesión) — sin CORS el navegador nunca envía la
 * respuesta al cliente (preflight `OPTIONS` 404 o respuesta sin `Access-Control-Allow-Origin`).
 * `credentials: true` es imprescindible para que el navegador adjunte/acepte la cookie de sesión
 * en requests cross-origin — sin esto, `fetch(..., { credentials: "include" })` del SPA no
 * recibe ni envía la cookie aunque el resto del CORS esté correcto.
 *
 * Los orígenes se leen de env (`PANEL_URL`/`PORTAL_URL`, ya mapeados en `config/configuration.ts`
 * para el resto de la app) — nunca hardcodeados — con el mismo fallback de dev que usa
 * `configuration.ts`. Se filtran los valores vacíos/falsy para no registrar `undefined` como
 * origen permitido si alguna env var llegara sin setear.
 */
export function crearCorsOptions(): CorsOptions {
  const origenesPermitidos = [
    process.env.PANEL_URL ?? "http://localhost:5173",
    process.env.PORTAL_URL ?? "http://localhost:5174",
  ].filter((origen): origen is string => Boolean(origen));

  return {
    origin: origenesPermitidos,
    credentials: true,
  };
}
