import { describe, expect, it } from "vitest";
import { validarArchivoImagen } from "./validar-archivo-imagen";
import { TAMANO_MAX_BYTES } from "./multimedia-constantes";

/** RN-028 / RN-029 / RN-030 — validación por archivo del lote (no lanza; devuelve resultado). */
describe("validarArchivoImagen", () => {
  const base = { nombre: "foto.jpg", tamanoBytes: 1024 };

  it("acepta JPEG y canoniza el formato a jpg (RN-029)", () => {
    const r = validarArchivoImagen({ ...base, mime: "image/jpeg" });
    expect(r).toEqual({ valido: true, formato: "jpg" });
  });

  it("acepta PNG (RN-029)", () => {
    expect(validarArchivoImagen({ ...base, mime: "image/png" })).toEqual({ valido: true, formato: "png" });
  });

  it("acepta WEBP (RN-029)", () => {
    expect(validarArchivoImagen({ ...base, mime: "image/webp" })).toEqual({ valido: true, formato: "webp" });
  });

  it("normaliza el MIME a minúsculas antes de resolver el formato", () => {
    expect(validarArchivoImagen({ ...base, mime: "IMAGE/JPEG" })).toEqual({ valido: true, formato: "jpg" });
  });

  it("rechaza un formato no permitido con el mensaje del spec (RN-029)", () => {
    const r = validarArchivoImagen({ ...base, mime: "image/gif" });
    expect(r).toEqual({ valido: false, motivo: "Formato no compatible. Usá JPG, PNG o WEBP." });
  });

  it("rechaza un archivo que excede el peso máximo de 10 MB (RN-030)", () => {
    const r = validarArchivoImagen({ ...base, mime: "image/png", tamanoBytes: TAMANO_MAX_BYTES + 1 });
    expect(r).toEqual({ valido: false, motivo: "Tamaño excedido: el peso máximo por imagen es de 10 MB." });
  });

  it("acepta un archivo exactamente en el límite de peso (RN-030, borde)", () => {
    const r = validarArchivoImagen({ ...base, mime: "image/png", tamanoBytes: TAMANO_MAX_BYTES });
    expect(r).toEqual({ valido: true, formato: "png" });
  });

  it("prioriza el formato inválido sobre el tamaño excedido", () => {
    const r = validarArchivoImagen({ ...base, mime: "image/gif", tamanoBytes: TAMANO_MAX_BYTES + 1 });
    expect(r).toEqual({ valido: false, motivo: "Formato no compatible. Usá JPG, PNG o WEBP." });
  });
});
