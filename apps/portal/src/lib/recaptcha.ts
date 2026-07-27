/**
 * Cliente de reCAPTCHA v3 invisible (ADR-007). El backend es quien verifica el token contra
 * Google (`siteverify`, clave secreta) — este módulo solo carga el script público en el
 * navegador y obtiene el token de la acción `contacto_whatsapp` (RN-003, RN-009).
 *
 * `estaRecaptchaConfigurado` es lógica pura (testable sin DOM). El resto de las funciones tocan
 * `window`/`document` y solo se invocan desde el Client Component de contacto — nunca en SSR.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, opciones: { action: string }) => Promise<string>;
    };
  }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
export const RECAPTCHA_ACCION_CONTACTO = "contacto_whatsapp";

const SCRIPT_ID = "recaptcha-v3-script";

/** `true` si hay una site key configurada (env `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`). */
export function estaRecaptchaConfigurado(siteKey: string = RECAPTCHA_SITE_KEY): boolean {
  return Boolean(siteKey && siteKey.trim().length > 0);
}

/**
 * Carga el script de reCAPTCHA v3 (una sola vez, reutiliza si ya está en el DOM) y resuelve
 * cuando `grecaptcha` está listo. Rechaza si el script no carga (error de red, RN-003).
 */
export function cargarScriptRecaptcha(siteKey: string = RECAPTCHA_SITE_KEY): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("recaptcha_ssr_no_disponible"));
      return;
    }

    if (window.grecaptcha) {
      window.grecaptcha.ready(() => resolve());
      return;
    }

    const existente = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existente) {
      existente.addEventListener("load", () => window.grecaptcha?.ready(() => resolve()));
      existente.addEventListener("error", () => reject(new Error("recaptcha_script_error")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.grecaptcha?.ready(() => resolve());
    script.onerror = () => reject(new Error("recaptcha_script_error"));
    document.head.appendChild(script);
  });
}

/** Ejecuta reCAPTCHA v3 en segundo plano y devuelve el token generado para la acción dada. */
export async function ejecutarRecaptcha(
  accion: string = RECAPTCHA_ACCION_CONTACTO,
  siteKey: string = RECAPTCHA_SITE_KEY,
): Promise<string> {
  await cargarScriptRecaptcha(siteKey);
  if (!window.grecaptcha) throw new Error("recaptcha_no_disponible");
  return window.grecaptcha.execute(siteKey, { action: accion });
}
