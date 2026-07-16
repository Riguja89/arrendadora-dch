import { describe, expect, it } from "vitest";
import { CatalogoItem } from "./catalogo-item.entity";

const AHORA = new Date("2026-07-01T10:00:00.000Z");
const DESPUES = new Date("2026-07-02T12:00:00.000Z");

/** ADR-005 — entidad genérica de catálogo administrable con borrado lógico. */
describe("CatalogoItem (entidad)", () => {
  it("crear arranca activo", () => {
    const item = CatalogoItem.crear({ id: "c-1", nombre: "Apartamento", orden: 1, ahora: AHORA }).toProps();
    expect(item.activo).toBe(true);
    expect(item.nombre).toBe("Apartamento");
    expect(item.orden).toBe(1);
    expect(item.createdAt).toEqual(AHORA);
  });

  it("editar solo aplica los campos definidos y toca updatedAt", () => {
    const item = CatalogoItem.crear({ id: "c-1", nombre: "Casa", orden: 1, ahora: AHORA });
    item.editar({ nombre: "Casa campestre" }, DESPUES);
    const props = item.toProps();
    expect(props.nombre).toBe("Casa campestre");
    expect(props.orden).toBe(1);
    expect(props.activo).toBe(true);
    expect(props.updatedAt).toEqual(DESPUES);
  });

  it("editar puede reactivar y reordenar", () => {
    const item = CatalogoItem.crear({ id: "c-1", nombre: "Local", orden: 1, ahora: AHORA });
    item.desactivar(DESPUES);
    item.editar({ activo: true, orden: 5 }, DESPUES);
    const props = item.toProps();
    expect(props.activo).toBe(true);
    expect(props.orden).toBe(5);
  });

  it("desactivar hace borrado lógico (activo = false)", () => {
    const item = CatalogoItem.crear({ id: "c-1", nombre: "Bodega", orden: 1, ahora: AHORA });
    item.desactivar(DESPUES);
    expect(item.activo).toBe(false);
    expect(item.toProps().updatedAt).toEqual(DESPUES);
  });
});
