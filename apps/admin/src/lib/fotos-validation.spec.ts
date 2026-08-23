import { describe, expect, it } from "vitest";
import {
  MAX_FOTOS_POR_PROPIEDAD,
  construirFormDataFotos,
  moverFotoAbajo,
  moverFotoArriba,
  ordenarFotosPorOrden,
  validarFormatoImagen,
  validarLoteFotos,
  validarPesoImagen,
} from "./fotos-validation";
import type { Foto } from "./propiedades-types";

/**
 * Cubre la lógica pura de la galería de fotos (RN-006, RN-014, RN-028, RN-029, RN-030, RN-031,
 * RN-032; ADR-008; GAP-001 resuelto). Sin renderizar React — mismo criterio que
 * `propiedad-form-validation.spec.ts`.
 */

function archivoFalso(nombre: string, tipo: string, tamanoBytes: number): File {
  return new File([new Uint8Array(Math.max(tamanoBytes, 1))], nombre, { type: tipo });
}

function fotoFalsa(overrides: Partial<Foto> & Pick<Foto, "id" | "orden">): Foto {
  return {
    propiedad_id: "prop-1",
    es_portada: false,
    formato_original: "jpg",
    url_optimizada: "https://cdn.example.com/opt.webp",
    url_card: "https://cdn.example.com/card.webp",
    url_thumbnail: "https://cdn.example.com/thumb.webp",
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("validarFormatoImagen (RN-029)", () => {
  it("acepta jpg, png y webp por MIME type", () => {
    expect(validarFormatoImagen(archivoFalso("a.jpg", "image/jpeg", 100))).toBe(true);
    expect(validarFormatoImagen(archivoFalso("b.png", "image/png", 100))).toBe(true);
    expect(validarFormatoImagen(archivoFalso("c.webp", "image/webp", 100))).toBe(true);
  });

  it("rechaza gif, bmp, svg y otros formatos no permitidos", () => {
    expect(validarFormatoImagen(archivoFalso("d.gif", "image/gif", 100))).toBe(false);
    expect(validarFormatoImagen(archivoFalso("e.bmp", "image/bmp", 100))).toBe(false);
    expect(validarFormatoImagen(archivoFalso("f.svg", "image/svg+xml", 100))).toBe(false);
  });

  it("cae a la extensión del nombre cuando el MIME type viene vacío", () => {
    expect(validarFormatoImagen(archivoFalso("foto.webp", "", 100))).toBe(true);
    expect(validarFormatoImagen(archivoFalso("foto.tiff", "", 100))).toBe(false);
  });
});

describe("validarPesoImagen (RN-030)", () => {
  it("acepta hasta 10 MB", () => {
    expect(validarPesoImagen(archivoFalso("a.jpg", "image/jpeg", 10 * 1024 * 1024))).toBe(true);
  });

  it("rechaza archivos mayores a 10 MB", () => {
    expect(validarPesoImagen(archivoFalso("a.jpg", "image/jpeg", 10 * 1024 * 1024 + 1))).toBe(false);
  });

  it("rechaza archivos vacíos (0 bytes)", () => {
    const vacio = new File([], "vacio.jpg", { type: "image/jpeg" });
    expect(validarPesoImagen(vacio)).toBe(false);
  });
});

describe("validarLoteFotos (CU-001, RN-028)", () => {
  it("acepta un lote todo válido sin rechazados", () => {
    const archivos = [archivoFalso("a.jpg", "image/jpeg", 1000), archivoFalso("b.png", "image/png", 1000)];
    const resultado = validarLoteFotos(archivos, 0);
    expect(resultado.validos).toHaveLength(2);
    expect(resultado.rechazados).toHaveLength(0);
  });

  it("lote mixto: los inválidos se reportan sin cancelar los válidos (HU-001 escenario 2)", () => {
    const archivos = [
      archivoFalso("valida.jpg", "image/jpeg", 1000),
      archivoFalso("gif-invalido.gif", "image/gif", 1000),
      archivoFalso("muy-pesada.jpg", "image/jpeg", 11 * 1024 * 1024),
    ];
    const resultado = validarLoteFotos(archivos, 0);
    expect(resultado.validos).toEqual([archivos[0]]);
    expect(resultado.rechazados).toHaveLength(2);
    expect(resultado.rechazados[0].motivo).toContain("Formato no compatible");
    expect(resultado.rechazados[1].motivo).toContain("10 MB");
  });

  it("respeta el cupo restante hasta el máximo de 10 fotos (GAP-001)", () => {
    const archivos = [archivoFalso("a.jpg", "image/jpeg", 1000), archivoFalso("b.jpg", "image/jpeg", 1000)];
    // Ya hay 9 fotos — solo cabe 1 más.
    const resultado = validarLoteFotos(archivos, 9);
    expect(resultado.validos).toHaveLength(1);
    expect(resultado.validos[0]).toBe(archivos[0]);
    expect(resultado.rechazados).toHaveLength(1);
    expect(resultado.rechazados[0].motivo).toContain(`máximo de ${MAX_FOTOS_POR_PROPIEDAD}`);
  });

  it("sin cupo disponible, rechaza todo el lote por límite de cantidad", () => {
    const archivos = [archivoFalso("a.jpg", "image/jpeg", 1000)];
    const resultado = validarLoteFotos(archivos, MAX_FOTOS_POR_PROPIEDAD);
    expect(resultado.validos).toHaveLength(0);
    expect(resultado.rechazados).toHaveLength(1);
  });
});

describe("construirFormDataFotos", () => {
  it("arma un FormData con el campo repetido 'archivos' (contrato DESIGN-028)", () => {
    const archivos = [archivoFalso("a.jpg", "image/jpeg", 1000), archivoFalso("b.jpg", "image/jpeg", 1000)];
    const formData = construirFormDataFotos(archivos);
    const valores = formData.getAll("archivos");
    expect(valores).toHaveLength(2);
    expect(valores[0]).toBe(archivos[0]);
    expect(valores[1]).toBe(archivos[1]);
  });
});

describe("ordenarFotosPorOrden", () => {
  it("ordena por el campo orden sin mutar el array original", () => {
    const fotos = [fotoFalsa({ id: "c", orden: 2 }), fotoFalsa({ id: "a", orden: 0 }), fotoFalsa({ id: "b", orden: 1 })];
    const ordenadas = ordenarFotosPorOrden(fotos);
    expect(ordenadas.map((f) => f.id)).toEqual(["a", "b", "c"]);
    expect(fotos.map((f) => f.id)).toEqual(["c", "a", "b"]); // el original no se mutó
  });
});

describe("moverFotoArriba / moverFotoAbajo (RN-031, controles alternativos al drag-and-drop)", () => {
  const fotos = [fotoFalsa({ id: "a", orden: 0 }), fotoFalsa({ id: "b", orden: 1 }), fotoFalsa({ id: "c", orden: 2 })];

  it("mueve una foto intermedia hacia arriba", () => {
    expect(moverFotoArriba(fotos, "b")).toEqual(["b", "a", "c"]);
  });

  it("mueve una foto intermedia hacia abajo", () => {
    expect(moverFotoAbajo(fotos, "b")).toEqual(["a", "c", "b"]);
  });

  it("la primera foto no se mueve más arriba", () => {
    expect(moverFotoArriba(fotos, "a")).toEqual(["a", "b", "c"]);
  });

  it("la última foto no se mueve más abajo", () => {
    expect(moverFotoAbajo(fotos, "c")).toEqual(["a", "b", "c"]);
  });

  it("un fotoId inexistente no altera el orden", () => {
    expect(moverFotoArriba(fotos, "no-existe")).toEqual(["a", "b", "c"]);
    expect(moverFotoAbajo(fotos, "no-existe")).toEqual(["a", "b", "c"]);
  });
});
