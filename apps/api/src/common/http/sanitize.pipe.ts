import { Injectable, type ArgumentMetadata, type PipeTransform } from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

/**
 * Campos EXCLUIDOS de sanitización (A-08) — se comparan contra la clave del wire (snake_case),
 * porque este pipe corre ANTES de `ValidationPipe`/class-transformer (recibe el body/query
 * plano, sin renombrar por `@Expose`). Nunca tocar:
 *
 * - Contraseñas (`password`, `password_actual`, `password_nueva`): mutarlas (aunque sea solo
 *   trim/strip) antes del hash podría rechazar contraseñas legítimas con esos caracteres o, peor,
 *   hashear un valor distinto al que el usuario escribió.
 * - Tokens opacos (`token`, `recaptcha_token`): son valores criptográficos/firmados — cualquier
 *   mutación los invalida.
 */
const CAMPOS_EXCLUIDOS = new Set(["password", "password_actual", "password_nueva", "token", "recaptcha_token"]);

const OPCIONES_SANITIZE_HTML: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  // Sin tags permitidas, el texto plano (incluyendo marcadores como `{codigo}` de
  // whatsapp_plantilla_mensaje — no son HTML, no se tocan) queda intacto; solo se remueven
  // construcciones tipo `<script>`, `<img onerror=...>`, `<svg onload=...>`, etc.
  disallowedTagsMode: "discard",
};

/**
 * Sanitización de inputs de texto (A-08, dep-audit BUILD-036) — mitiga XSS almacenado /
 * inyección de HTML: recorta espacios y remueve construcciones tipo `<script>`/`<img onerror>`
 * de TODO string de `@Body()`/`@Query()`, recursivamente (arrays y objetos anidados), excepto
 * los campos de `CAMPOS_EXCLUIDOS`.
 *
 * Se registra ANTES del `ValidationPipe` global (`main.ts`) para que las validaciones de
 * longitud/formato de `class-validator` corran sobre el valor YA sanitizado — consistente con lo
 * que finalmente se persiste. No toca `@Param()` (ids/slugs, sin riesgo de XSS almacenado) ni
 * parámetros `custom` (`@UsuarioActual()` — no son input del cliente).
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== "body" && metadata.type !== "query") {
      return value;
    }
    return sanearProfundo(value);
  }
}

function sanearProfundo(valor: unknown, clave?: string): unknown {
  if (typeof valor === "string") {
    if (clave && CAMPOS_EXCLUIDOS.has(clave)) {
      return valor;
    }
    return sanearString(valor);
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => sanearProfundo(item, clave));
  }
  if (valor !== null && typeof valor === "object") {
    const resultado: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) {
      resultado[k] = sanearProfundo(v, k);
    }
    return resultado;
  }
  return valor;
}

function sanearString(texto: string): string {
  const limpio = sanitizeHtml(texto.trim(), OPCIONES_SANITIZE_HTML);
  // `sanitize-html` serializa SIEMPRE pensando en re-embeber el resultado en HTML: cualquier
  // `&`/`<`/`>` suelto que sobrevive (no forma parte de un tag real — esos ya fueron removidos
  // por el parser) queda entity-encoded (`&amp;`/`&lt;`/`&gt;`) en el output. Esta API es un
  // boundary JSON de texto plano, no HTML — sin decodificar, un valor legítimo como
  // "Juan & Asociados" quedaría persistido y devuelto como "Juan &amp; Asociados" (verían el
  // artefacto en el frontend, que interpola texto plano — React/Vue/Angular no decodifican
  // entidades). Decodificar acá es seguro: el parser de `sanitize-html` ya corrió sobre el input
  // ORIGINAL y ya removió cualquier tag real; este reemplazo solo actúa sobre texto que el propio
  // parser determinó que NO era markup, así que no puede "reconstruir" un tag removido.
  return limpio.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
