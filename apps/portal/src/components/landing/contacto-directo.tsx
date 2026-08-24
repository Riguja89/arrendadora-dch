import {
  construirEnlaceEmail,
  construirEnlaceFacebook,
  construirEnlaceInstagram,
  construirEnlaceTelefono,
  construirEnlaceWhatsapp,
  DATOS_CONTACTO,
} from "@/lib/contacto-config";
import {
  IconoEmail,
  IconoFacebook,
  IconoInstagram,
  IconoTelefono,
  IconoUbicacion,
  IconoWhatsapp,
} from "./iconos";

/**
 * Bloque de contacto directo (HU-L03, RN-L02). Solo enlaces directos, sin
 * formulario ni backend: WhatsApp (deep link con mensaje prellenado), teléfono
 * (`tel:`), email (`mailto:`) y redes sociales. Fondo oscuro para contraste
 * dramático. `id="contacto"` recibe el ancla del CTA "Contáctanos" del hero.
 */
export function ContactoDirecto() {
  return (
    <section id="contacto" className="contacto-directo" aria-labelledby="contacto-titulo">
      <div className="contenedor-landing">
        <h2 id="contacto-titulo" className="contacto-directo__titulo">
          Contáctanos
        </h2>
        <p className="contacto-directo__intro">
          Estamos listos para ayudarte. Escríbenos o llámanos y te asesoramos sin compromiso.
        </p>

        <ul className="contacto-directo__grid">
          <li>
            <a
              href={construirEnlaceWhatsapp()}
              className="contacto-card contacto-card--destacada"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribir por WhatsApp (abre en una pestaña nueva)"
            >
              <span className="contacto-card__icono" aria-hidden="true">
                <IconoWhatsapp />
              </span>
              <span className="contacto-card__cuerpo">
                <span className="contacto-card__etiqueta">WhatsApp</span>
                <span className="contacto-card__dato">{DATOS_CONTACTO.telefonoEtiqueta}</span>
              </span>
            </a>
          </li>

          <li>
            <a
              href={construirEnlaceTelefono()}
              className="contacto-card"
              aria-label={`Llamar al ${DATOS_CONTACTO.telefonoEtiqueta}`}
            >
              <span className="contacto-card__icono" aria-hidden="true">
                <IconoTelefono />
              </span>
              <span className="contacto-card__cuerpo">
                <span className="contacto-card__etiqueta">Teléfono</span>
                <span className="contacto-card__dato">{DATOS_CONTACTO.telefonoEtiqueta}</span>
              </span>
            </a>
          </li>

          <li>
            <a
              href={construirEnlaceEmail()}
              className="contacto-card"
              aria-label={`Enviar un correo a ${DATOS_CONTACTO.email}`}
            >
              <span className="contacto-card__icono" aria-hidden="true">
                <IconoEmail />
              </span>
              <span className="contacto-card__cuerpo">
                <span className="contacto-card__etiqueta">Email</span>
                <span className="contacto-card__dato">{DATOS_CONTACTO.email}</span>
              </span>
            </a>
          </li>

          <li>
            <div className="contacto-card contacto-card--estatica">
              <span className="contacto-card__icono" aria-hidden="true">
                <IconoUbicacion />
              </span>
              <span className="contacto-card__cuerpo">
                <span className="contacto-card__etiqueta">Dirección</span>
                <span className="contacto-card__dato">{DATOS_CONTACTO.direccion}</span>
              </span>
            </div>
          </li>
        </ul>

        <div className="contacto-directo__redes">
          <a
            href={construirEnlaceInstagram()}
            className="contacto-directo__red"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de D-CH Inmobiliaria (abre en una pestaña nueva)"
          >
            <IconoInstagram />
          </a>
          <a
            href={construirEnlaceFacebook()}
            className="contacto-directo__red"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook de D-CH Inmobiliaria (abre en una pestaña nueva)"
          >
            <IconoFacebook />
          </a>
        </div>
      </div>
    </section>
  );
}
