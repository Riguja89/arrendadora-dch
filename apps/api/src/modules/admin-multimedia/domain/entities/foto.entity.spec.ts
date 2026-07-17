import { describe, expect, it } from "vitest";
import { Foto } from "./foto.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const DESPUES = new Date("2026-07-02T10:00:00.000Z");

describe("Foto", () => {
  it("crear() inicializa orden 0 y esPortada false (la galería asigna la posición al agregar)", () => {
    const foto = Foto.crear({ id: "f-1", propiedadId: "p-1", s3KeyBase: "k/f-1", formatoOriginal: "jpg", ahora: AHORA });
    const props = foto.toProps();
    expect(props.orden).toBe(0);
    expect(props.esPortada).toBe(false);
    expect(props.createdAt).toEqual(AHORA);
    expect(props.updatedAt).toEqual(AHORA);
    expect(foto.id).toBe("f-1");
    expect(foto.formatoOriginal).toBe("jpg");
  });

  it("reconstituir() restaura los props sin mutarlos", () => {
    const foto = Foto.reconstituir({
      id: "f-2", propiedadId: "p-1", orden: 3, esPortada: false, s3KeyBase: "k/f-2",
      formatoOriginal: "png", createdAt: AHORA, updatedAt: AHORA,
    });
    expect(foto.orden).toBe(3);
    expect(foto.esPortada).toBe(false);
    expect(foto.s3KeyBase).toBe("k/f-2");
  });

  it("aplicarPosicion() fija orden/portada y toca updatedAt cuando cambia", () => {
    const foto = Foto.crear({ id: "f-1", propiedadId: "p-1", s3KeyBase: "k/f-1", formatoOriginal: "jpg", ahora: AHORA });
    foto.aplicarPosicion(1, true, DESPUES);
    expect(foto.orden).toBe(1);
    expect(foto.esPortada).toBe(true);
    expect(foto.updatedAt).toEqual(DESPUES);
  });

  it("aplicarPosicion() no toca updatedAt cuando orden y portada no cambian (idempotente)", () => {
    const foto = Foto.reconstituir({
      id: "f-1", propiedadId: "p-1", orden: 2, esPortada: false, s3KeyBase: "k/f-1",
      formatoOriginal: "webp", createdAt: AHORA, updatedAt: AHORA,
    });
    foto.aplicarPosicion(2, false, DESPUES);
    expect(foto.updatedAt).toEqual(AHORA);
  });
});
