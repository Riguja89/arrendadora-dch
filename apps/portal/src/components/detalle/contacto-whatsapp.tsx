"use client";

import { useState } from "react";
import { generarContactoWhatsapp, mensajeErrorContacto } from "@/lib/api/detalle";
import { estaRecaptchaConfigurado, ejecutarRecaptcha } from "@/lib/recaptcha";

type EstadoContacto = "inactivo" | "validando" | "error";

const MENSAJE_ANTIBOT_NO_DISPONIBLE =
  "En este momento no podemos validar tu solicitud. Intentá de nuevo en unos minutos.";

interface ContactoWhatsappProps {
  slug: string;
}

/**
 * Botón "Contactar por WhatsApp" (HU-003, CU-002). Ejecuta reCAPTCHA v3 invisible (ADR-007) en
 * segundo plano, pide al backend el deep link ya validado (ADR-012) y abre WhatsApp. RN-003: sin
 * anti-bot configurado el botón queda deshabilitado con el mensaje exacto de la spec; RN-009: la
 * validación solo se dispara al hacer clic, nunca al navegar la ficha.
 */
export function ContactoWhatsapp({ slug }: ContactoWhatsappProps) {
  const [estado, setEstado] = useState<EstadoContacto>("inactivo");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const antibotConfigurado = estaRecaptchaConfigurado();

  async function manejarClic() {
    if (!antibotConfigurado || estado === "validando") return;

    setEstado("validando");
    setMensaje(null);

    let token: string;
    try {
      token = await ejecutarRecaptcha();
    } catch {
      setEstado("error");
      setMensaje(MENSAJE_ANTIBOT_NO_DISPONIBLE);
      return;
    }

    const respuesta = await generarContactoWhatsapp(slug, token);
    if (!respuesta.ok) {
      setEstado("error");
      setMensaje(mensajeErrorContacto(respuesta.error));
      return;
    }

    setEstado("inactivo");
    window.open(respuesta.data.deepLink, "_blank", "noopener,noreferrer");
  }

  const deshabilitado = !antibotConfigurado || estado === "validando";

  return (
    <div className="contacto-whatsapp">
      <button
        type="button"
        className="contacto-whatsapp__boton"
        onClick={manejarClic}
        disabled={deshabilitado}
        aria-disabled={deshabilitado}
      >
        {estado === "validando" ? "Validando…" : "Contactar por WhatsApp"}
      </button>

      {!antibotConfigurado ? (
        <p className="contacto-whatsapp__mensaje" role="status">
          {MENSAJE_ANTIBOT_NO_DISPONIBLE}
        </p>
      ) : null}

      {antibotConfigurado && mensaje ? (
        <p className="contacto-whatsapp__mensaje contacto-whatsapp__mensaje--error" role="alert">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
