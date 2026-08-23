import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperacionPassword } from "@/lib/password-api";
import {
  MENSAJE_FORGOT_PASSWORD_NEUTRO,
  construirPayloadForgotPassword,
  mapearErroresValidacionPassword,
  validarEmailRecuperacion,
} from "@/lib/password-validation";

/**
 * CU-002 pasos 1-4 — solicitud de recuperación de contraseña. RN-019: la respuesta es siempre el
 * mismo mensaje neutro (`MENSAJE_FORGOT_PASSWORD_NEUTRO`), exista o no el email registrado — no
 * hay forma de distinguir en la UI un email válido de uno inválido. La única excepción es un 422
 * de formato, que sí se muestra como error de campo (el usuario necesita saber que escribió mal
 * el correo, eso no revela nada sobre registros existentes).
 */
export function ForgotPasswordPage() {
  const emailId = useId();

  const [email, setEmail] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();

    const validacion = validarEmailRecuperacion(email);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    setEnviando(true);
    const resultado = await solicitarRecuperacionPassword(construirPayloadForgotPassword(email));
    setEnviando(false);

    if (!resultado.ok && resultado.error.detalles && resultado.error.detalles.length > 0) {
      setErrores((actual) => ({ ...actual, ...mapearErroresValidacionPassword(resultado.error.detalles) }));
      return;
    }

    // RN-019 — neutro también ante error de red/servicio: nunca se distingue de un envío exitoso.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="login-page">
        <h1>Recuperar contraseña</h1>
        <p role="status">{MENSAJE_FORGOT_PASSWORD_NEUTRO}</p>
        <p>
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="login-page">
      <h1>Recuperar contraseña</h1>
      <p className="texto-muted">Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <form className="login-page__form" onSubmit={manejarEnvio} noValidate>
        <div className="campo">
          <label htmlFor={emailId}>Correo electrónico</label>
          <input
            id={emailId}
            type="email"
            autoComplete="username"
            required
            value={email}
            disabled={enviando}
            onChange={(evento) => setEmail(evento.target.value)}
          />
          {errores.email ? <span className="campo-error">{errores.email}</span> : null}
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar enlace de recuperación"}
        </button>
      </form>
      <p>
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </main>
  );
}
