import { describe, expect, it } from "vitest";
import { GaleriaFotos, type FotoSubida } from "./galeria-fotos.entity";
import { Foto } from "./foto.entity";
import {
  FotoNoEncontradaError,
  MaximoFotosExcedidoError,
  OrdenFotosInvalidoError,
  UltimaFotoPropiedadVisibleError,
} from "../errors/dominio-multimedia.errors";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const PROP = "p-1";

/** Fotos ya persistidas (reconstituidas) con orden explícito. */
function fotoPersistida(id: string, orden: number, esPortada: boolean): Foto {
  return Foto.reconstituir({
    id, propiedadId: PROP, orden, esPortada, s3KeyBase: `propiedades/${PROP}/${id}`,
    formatoOriginal: "jpg", createdAt: AHORA, updatedAt: AHORA,
  });
}

function subida(id: string): FotoSubida {
  return { id, s3KeyBase: `propiedades/${PROP}/${id}`, formatoOriginal: "jpg" };
}

/** Ids en orden de visualización (portada primero). */
const ids = (g: GaleriaFotos) => g.fotos().map((f) => f.id);
const ordenes = (g: GaleriaFotos) => g.fotos().map((f) => f.orden);
const portadas = (g: GaleriaFotos) => g.fotos().filter((f) => f.esPortada).map((f) => f.id);

describe("GaleriaFotos — reconstituir y normalización", () => {
  it("reconstituir() ordena por 'orden' y normaliza a 1..N con portada única (la primera)", () => {
    const g = GaleriaFotos.reconstituir(PROP, [
      fotoPersistida("b", 2, false),
      fotoPersistida("a", 1, true),
      fotoPersistida("c", 3, false),
    ]);
    expect(ids(g)).toEqual(["a", "b", "c"]);
    expect(ordenes(g)).toEqual([1, 2, 3]);
    expect(portadas(g)).toEqual(["a"]);
  });

  it("vacia() crea una galería sin fotos", () => {
    const g = GaleriaFotos.vacia(PROP);
    expect(g.fotos()).toHaveLength(0);
  });
});

describe("GaleriaFotos.agregar (CU-001 / RN-028 / RN-014)", () => {
  it("la primera foto de una galería vacía queda como portada (RN-014)", () => {
    const g = GaleriaFotos.vacia(PROP);
    const nuevas = g.agregar([subida("a")], AHORA);
    expect(nuevas).toHaveLength(1);
    expect(portadas(g)).toEqual(["a"]);
    expect(ordenes(g)).toEqual([1]);
  });

  it("agrega al final preservando la portada existente y con orden contiguo", () => {
    const g = GaleriaFotos.reconstituir(PROP, [fotoPersistida("a", 1, true)]);
    g.agregar([subida("b"), subida("c")], AHORA);
    expect(ids(g)).toEqual(["a", "b", "c"]);
    expect(ordenes(g)).toEqual([1, 2, 3]);
    expect(portadas(g)).toEqual(["a"]);
  });

  it("agregar([]) es no-op y devuelve lista vacía", () => {
    const g = GaleriaFotos.reconstituir(PROP, [fotoPersistida("a", 1, true)]);
    expect(g.agregar([], AHORA)).toEqual([]);
    expect(ids(g)).toEqual(["a"]);
  });

  it("lanza MaximoFotosExcedidoError si la carga excede el tope de 10 (GAP-001)", () => {
    const existentes = Array.from({ length: 8 }, (_, i) => fotoPersistida(`f${i}`, i + 1, i === 0));
    const g = GaleriaFotos.reconstituir(PROP, existentes);
    expect(() => g.agregar([subida("x"), subida("y"), subida("z")], AHORA)).toThrow(MaximoFotosExcedidoError);
  });

  it("permite llegar exactamente a 10 fotos (borde del tope)", () => {
    const existentes = Array.from({ length: 8 }, (_, i) => fotoPersistida(`f${i}`, i + 1, i === 0));
    const g = GaleriaFotos.reconstituir(PROP, existentes);
    g.agregar([subida("x"), subida("y")], AHORA);
    expect(g.fotos()).toHaveLength(10);
    expect(ordenes(g)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe("GaleriaFotos.reordenar (CU-002 / RN-031)", () => {
  const nueva = () =>
    GaleriaFotos.reconstituir(PROP, [
      fotoPersistida("a", 1, true),
      fotoPersistida("b", 2, false),
      fotoPersistida("c", 3, false),
    ]);

  it("reordena y recalcula orden 1..N; la nueva primera es la portada", () => {
    const g = nueva();
    g.reordenar(["c", "a", "b"], AHORA);
    expect(ids(g)).toEqual(["c", "a", "b"]);
    expect(ordenes(g)).toEqual([1, 2, 3]);
    expect(portadas(g)).toEqual(["c"]);
  });

  it("lanza OrdenFotosInvalidoError si falta una foto (conteo distinto)", () => {
    expect(() => nueva().reordenar(["a", "b"], AHORA)).toThrow(OrdenFotosInvalidoError);
  });

  it("lanza OrdenFotosInvalidoError si hay ids repetidos", () => {
    expect(() => nueva().reordenar(["a", "a", "b"], AHORA)).toThrow(OrdenFotosInvalidoError);
  });

  it("lanza OrdenFotosInvalidoError si aparece un id que no pertenece a la galería", () => {
    expect(() => nueva().reordenar(["a", "b", "x"], AHORA)).toThrow(OrdenFotosInvalidoError);
  });
});

describe("GaleriaFotos.marcarPortada (RN-014)", () => {
  it("mueve la foto marcada al inicio y la deja como portada única", () => {
    const g = GaleriaFotos.reconstituir(PROP, [
      fotoPersistida("a", 1, true),
      fotoPersistida("b", 2, false),
      fotoPersistida("c", 3, false),
    ]);
    g.marcarPortada("c", AHORA);
    expect(ids(g)).toEqual(["c", "a", "b"]);
    expect(portadas(g)).toEqual(["c"]);
    expect(ordenes(g)).toEqual([1, 2, 3]);
  });

  it("lanza FotoNoEncontradaError si la foto no está en la galería", () => {
    const g = GaleriaFotos.reconstituir(PROP, [fotoPersistida("a", 1, true)]);
    expect(() => g.marcarPortada("x", AHORA)).toThrow(FotoNoEncontradaError);
  });
});

describe("GaleriaFotos.eliminar (RN-032 / ADR-008)", () => {
  const conTres = () =>
    GaleriaFotos.reconstituir(PROP, [
      fotoPersistida("a", 1, true),
      fotoPersistida("b", 2, false),
      fotoPersistida("c", 3, false),
    ]);

  it("elimina una foto no portada y recalcula orden contiguo", () => {
    const g = conTres();
    const eliminada = g.eliminar("b", true, AHORA);
    expect(eliminada.id).toBe("b");
    expect(ids(g)).toEqual(["a", "c"]);
    expect(ordenes(g)).toEqual([1, 2]);
    expect(portadas(g)).toEqual(["a"]);
  });

  it("al eliminar la portada, la siguiente en orden pasa a portada (RN-032)", () => {
    const g = conTres();
    g.eliminar("a", true, AHORA);
    expect(ids(g)).toEqual(["b", "c"]);
    expect(portadas(g)).toEqual(["b"]);
  });

  it("lanza FotoNoEncontradaError si la foto no existe", () => {
    expect(() => conTres().eliminar("x", true, AHORA)).toThrow(FotoNoEncontradaError);
  });

  it("lanza UltimaFotoPropiedadVisibleError al eliminar la última foto de una propiedad visible (ADR-008)", () => {
    const g = GaleriaFotos.reconstituir(PROP, [fotoPersistida("a", 1, true)]);
    expect(() => g.eliminar("a", true, AHORA)).toThrow(UltimaFotoPropiedadVisibleError);
  });

  it("permite eliminar la última foto si la propiedad NO es visible", () => {
    const g = GaleriaFotos.reconstituir(PROP, [fotoPersistida("a", 1, true)]);
    const eliminada = g.eliminar("a", false, AHORA);
    expect(eliminada.id).toBe("a");
    expect(g.fotos()).toHaveLength(0);
  });
});
