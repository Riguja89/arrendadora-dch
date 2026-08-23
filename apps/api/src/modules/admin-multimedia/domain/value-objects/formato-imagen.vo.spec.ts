import { describe, expect, it } from "vitest";
import { CONTENT_TYPE_POR_FORMATO, type FormatoImagen } from "./formato-imagen.vo";

/** RN-029 — formatos permitidos y su content-type al servirse desde el almacenamiento/CDN. */
describe("CONTENT_TYPE_POR_FORMATO", () => {
  it("mapea los tres formatos permitidos a su content-type estándar", () => {
    expect(CONTENT_TYPE_POR_FORMATO.jpg).toBe("image/jpeg");
    expect(CONTENT_TYPE_POR_FORMATO.png).toBe("image/png");
    expect(CONTENT_TYPE_POR_FORMATO.webp).toBe("image/webp");
  });

  it("cubre exactamente los formatos permitidos (jpg, png, webp)", () => {
    const formatos = Object.keys(CONTENT_TYPE_POR_FORMATO).sort();
    expect(formatos).toEqual(["jpg", "png", "webp"] satisfies FormatoImagen[]);
  });
});
