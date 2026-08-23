import { describe, expect, it } from "vitest";
import { PlantillaMensaje } from "./plantilla-mensaje.vo";
import { PlantillaMensajeInvalidaError } from "../errors/dominio-configuracion.errors";

describe("PlantillaMensaje", () => {
  it("acepta una plantilla con el marcador {codigo} (GAP-002)", () => {
    const plantilla = PlantillaMensaje.crear("Hola, me interesa la propiedad {codigo}.");
    expect(plantilla.valor).toBe("Hola, me interesa la propiedad {codigo}.");
    expect(plantilla.incluyeCodigo).toBe(true);
  });

  it("acepta una plantilla sin marcadores", () => {
    const plantilla = PlantillaMensaje.crear("Hola, quiero más información.");
    expect(plantilla.incluyeCodigo).toBe(false);
  });

  it("recorta espacios en los extremos", () => {
    expect(PlantillaMensaje.crear("  Hola {codigo}  ").valor).toBe("Hola {codigo}");
  });

  it("rechaza una plantilla vacía", () => {
    expect(() => PlantillaMensaje.crear("   ")).toThrow(PlantillaMensajeInvalidaError);
  });

  it("rechaza una plantilla con un marcador no permitido", () => {
    expect(() => PlantillaMensaje.crear("Hola {nombre}, mirá la {codigo}.")).toThrow(
      PlantillaMensajeInvalidaError,
    );
  });
});
