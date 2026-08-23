import { describe, expect, it } from "vitest";
import { HistorialEstado } from "./historial-estado.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

/** ADR-006 / GAP-007 — entrada append-only del historial de estados. */
describe("HistorialEstado (entidad)", () => {
  it("registrar captura la transición con timestamp y responsable", () => {
    const entrada = HistorialEstado.registrar({
      id: "h-1",
      propiedadId: "prop-1",
      estadoAnterior: "disponible",
      estadoNuevo: "reservada",
      usuarioId: "u-1",
      nota: "Cliente separó",
      ahora: AHORA,
    }).toProps();

    expect(entrada.id).toBe("h-1");
    expect(entrada.propiedadId).toBe("prop-1");
    expect(entrada.estadoAnterior).toBe("disponible");
    expect(entrada.estadoNuevo).toBe("reservada");
    expect(entrada.usuarioId).toBe("u-1");
    expect(entrada.nota).toBe("Cliente separó");
    expect(entrada.cambiadoEn).toEqual(AHORA);
  });

  it("acepta nota nula", () => {
    const entrada = HistorialEstado.registrar({
      id: "h-2",
      propiedadId: "prop-1",
      estadoAnterior: "reservada",
      estadoNuevo: "arrendada_vendida",
      usuarioId: "u-1",
      nota: null,
      ahora: AHORA,
    }).toProps();
    expect(entrada.nota).toBeNull();
  });
});
