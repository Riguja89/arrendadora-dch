import { describe, expect, it } from "vitest";
import type { ArgumentMetadata } from "@nestjs/common";
import { SanitizePipe } from "./sanitize.pipe";

const BODY_META: ArgumentMetadata = { type: "body" };
const QUERY_META: ArgumentMetadata = { type: "query" };
const PARAM_META: ArgumentMetadata = { type: "param", data: "id" };
const CUSTOM_META: ArgumentMetadata = { type: "custom" };

/** A-08 (dep-audit BUILD-036) — sanitización de inputs de texto (trim + strip HTML). */
describe("SanitizePipe (A-08)", () => {
  const pipe = new SanitizePipe();

  it("recorta espacios y remueve un <script> malicioso, preservando el texto legítimo", () => {
    const resultado = pipe.transform({ titulo: "  <script>alert(1)</script>Casa bonita  " }, BODY_META);
    expect(resultado).toEqual({ titulo: "Casa bonita" });
  });

  it("remueve tags con atributos peligrosos (onerror) aunque no estén en la allowlist", () => {
    const resultado = pipe.transform({ descripcion: '<img src=x onerror="alert(1)">Hola' }, BODY_META);
    expect(resultado).toEqual({ descripcion: "Hola" });
  });

  it("sanea recursivamente arrays y objetos anidados", () => {
    const resultado = pipe.transform(
      { amenidades: [{ nombre: "<b>Piscina</b>" }, { nombre: "  Gimnasio  " }] },
      BODY_META,
    );
    expect(resultado).toEqual({ amenidades: [{ nombre: "Piscina" }, { nombre: "Gimnasio" }] });
  });

  it("NO toca password/password_actual/password_nueva/token/recaptcha_token (excluidos)", () => {
    const payload = {
      password: "  <b>Secreta1</b>  ",
      password_actual: "<i>Vieja1</i>",
      password_nueva: "<i>Nueva1</i>",
      token: "  raw-token-<>  ",
      recaptcha_token: "tok-<script>",
    };
    expect(pipe.transform(payload, BODY_META)).toEqual(payload);
  });

  it("preserva el marcador {codigo} de la plantilla de WhatsApp (no es HTML)", () => {
    const resultado = pipe.transform(
      { whatsapp_plantilla_mensaje: "Hola, veo el código {codigo} en el portal" },
      BODY_META,
    );
    expect(resultado).toEqual({ whatsapp_plantilla_mensaje: "Hola, veo el código {codigo} en el portal" });
  });

  it("no HTML-encodea caracteres sueltos legítimos (&, <, >) que no forman un tag real", () => {
    const resultado = pipe.transform(
      { nombre_inmobiliaria: "Juan & Asociados", nota: "área < 100 m2 y precio > 0" },
      BODY_META,
    );
    expect(resultado).toEqual({
      nombre_inmobiliaria: "Juan & Asociados",
      nota: "área < 100 m2 y precio > 0",
    });
  });

  it("deja pasar valores no-string (números/booleanos/null/undefined) sin tocar", () => {
    const payload = { pagina: 1, destacada: true, direccion: null, estrato: undefined };
    expect(pipe.transform(payload, BODY_META)).toEqual(payload);
  });

  it("aplica también sobre metadata.type 'query'", () => {
    expect(pipe.transform({ q: "  <script>x</script>buscar  " }, QUERY_META)).toEqual({ q: "buscar" });
  });

  it("NO toca metadata.type 'param' ni 'custom' — pasa el valor intacto", () => {
    expect(pipe.transform("  <b>id-123</b>  ", PARAM_META)).toBe("  <b>id-123</b>  ");
    expect(pipe.transform({ id: "u-1" }, CUSTOM_META)).toEqual({ id: "u-1" });
  });
});
