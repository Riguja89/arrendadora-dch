import { describe, expect, it } from "vitest";
import {
  conteoBadgeDrawer,
  crearEstadoInicial,
  reducerDrawerFiltros,
} from "./bottom-sheet-state";
import { VALORES_FILTROS_VACIOS } from "./catalogo-filtros";

/**
 * Unit tests del state machine del drawer de filtros mobile (BUILD-041 DoD §8.4):
 *   - Apertura del sheet.
 *   - Edición reactiva del borrador sin tocar los valores aplicados.
 *   - Cierre por descarte (X, overlay, Escape) restaura el borrador.
 *   - Cierre por submit (`aplicar`) promueve el borrador a aplicado.
 *   - Contador del badge refleja los valores APLICADOS, no el borrador.
 */
describe("crearEstadoInicial", () => {
  it("arranca cerrado y con snapshot vacío cuando no hay iniciales", () => {
    const estado = crearEstadoInicial();
    expect(estado.abierto).toBe(false);
    expect(estado.valoresAplicados).toEqual(VALORES_FILTROS_VACIOS);
    expect(estado.borrador).toEqual(VALORES_FILTROS_VACIOS);
  });

  it("rehidrata borrador y aplicados desde los searchParams del server", () => {
    const estado = crearEstadoInicial({
      tipoOperacion: "arriendo",
      ciudad: "Yopal",
    });
    expect(estado.valoresAplicados.tipoOperacion).toBe("arriendo");
    expect(estado.valoresAplicados.ciudad).toBe("Yopal");
    expect(estado.borrador).toEqual(estado.valoresAplicados);
  });
});

describe("reducerDrawerFiltros — apertura y cierre", () => {
  it("`abrir` monta el sheet y sincroniza el borrador con lo aplicado", () => {
    const inicial = crearEstadoInicial({ tipoOperacion: "arriendo" });
    const abierto = reducerDrawerFiltros(inicial, { tipo: "abrir" });
    expect(abierto.abierto).toBe(true);
    expect(abierto.borrador.tipoOperacion).toBe("arriendo");
  });

  it("`descartar` cierra y restaura el borrador a los aplicados", () => {
    // Simula: apertura, cambio del borrador, cierre con X/overlay/Escape.
    let estado = crearEstadoInicial({ ciudad: "Yopal" });
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "ciudad",
      valor: "Aguazul",
    });
    expect(estado.borrador.ciudad).toBe("Aguazul");
    expect(estado.valoresAplicados.ciudad).toBe("Yopal");

    const descartado = reducerDrawerFiltros(estado, { tipo: "descartar" });
    expect(descartado.abierto).toBe(false);
    // El borrador vuelve a lo que estaba aplicado — el cambio se pierde.
    expect(descartado.borrador.ciudad).toBe("Yopal");
    expect(descartado.valoresAplicados.ciudad).toBe("Yopal");
  });
});

describe("reducerDrawerFiltros — edición del borrador", () => {
  it("`cambiar-campo` modifica solo el borrador, nunca los aplicados", () => {
    let estado = crearEstadoInicial();
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "precioMax",
      valor: "3500000",
    });
    expect(estado.borrador.precioMax).toBe("3500000");
    expect(estado.valoresAplicados.precioMax).toBe("");
  });

  it("edición encadenada preserva los demás campos del borrador", () => {
    let estado = crearEstadoInicial();
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "tipoOperacion",
      valor: "venta",
    });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "ciudad",
      valor: "Yopal",
    });
    expect(estado.borrador.tipoOperacion).toBe("venta");
    expect(estado.borrador.ciudad).toBe("Yopal");
  });
});

describe("reducerDrawerFiltros — aplicar", () => {
  it("`aplicar` promueve el borrador a los aplicados y cierra el sheet", () => {
    let estado = crearEstadoInicial();
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "tipoOperacion",
      valor: "arriendo",
    });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "ciudad",
      valor: "Yopal",
    });

    const aplicado = reducerDrawerFiltros(estado, { tipo: "aplicar" });
    expect(aplicado.abierto).toBe(false);
    expect(aplicado.valoresAplicados.tipoOperacion).toBe("arriendo");
    expect(aplicado.valoresAplicados.ciudad).toBe("Yopal");
    // Y el borrador queda sincronizado con lo recién aplicado.
    expect(aplicado.borrador).toEqual(aplicado.valoresAplicados);
  });
});

describe("reducerDrawerFiltros — sincronización con URL", () => {
  it("con drawer cerrado, sincroniza aplicados Y borrador", () => {
    const inicial = crearEstadoInicial();
    const sincronizado = reducerDrawerFiltros(inicial, {
      tipo: "sincronizar-desde-url",
      iniciales: { tipoOperacion: "venta", ciudad: "Aguazul" },
    });
    expect(sincronizado.abierto).toBe(false);
    expect(sincronizado.valoresAplicados.tipoOperacion).toBe("venta");
    expect(sincronizado.borrador.tipoOperacion).toBe("venta");
  });

  it("con drawer abierto, NO pisa el borrador que el usuario está editando", () => {
    let estado = crearEstadoInicial({ tipoOperacion: "arriendo" });
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "ciudad",
      valor: "Yopal",
    });

    const sincronizado = reducerDrawerFiltros(estado, {
      tipo: "sincronizar-desde-url",
      iniciales: { tipoOperacion: "venta" },
    });
    expect(sincronizado.abierto).toBe(true);
    expect(sincronizado.valoresAplicados.tipoOperacion).toBe("venta");
    // El borrador que el usuario está editando queda intacto.
    expect(sincronizado.borrador.ciudad).toBe("Yopal");
    expect(sincronizado.borrador.tipoOperacion).toBe("arriendo");
  });
});

describe("conteoBadgeDrawer", () => {
  it("solo cuenta los filtros APLICADOS (no el borrador)", () => {
    let estado = crearEstadoInicial({ tipoOperacion: "arriendo" });
    estado = reducerDrawerFiltros(estado, { tipo: "abrir" });
    estado = reducerDrawerFiltros(estado, {
      tipo: "cambiar-campo",
      campo: "ciudad",
      valor: "Yopal",
    });
    // Borrador tiene 2, aplicados sigue en 1 → badge muestra 1.
    expect(conteoBadgeDrawer(estado)).toBe(1);

    const aplicado = reducerDrawerFiltros(estado, { tipo: "aplicar" });
    expect(conteoBadgeDrawer(aplicado)).toBe(2);
  });
});
