import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { restablecerPassword } from "@/lib/password-api";
import {
  MENSAJE_ENLACE_INVALIDO,
  construirPayloadResetPassword,
  mapearErroresValidacionPassword,
  validarNuevaPassword,
} from "@/lib/password-validation";

/**
 * CU-002 pasos 6-11 — formulario de nueva contraseña tras hacer clic en el enlace del correo. El
 * token viaja como query string `?token=...` (ver `${panelUrl}/reset-password?token=${tokenPlano}`
 * en `apps/api/.../solicitar-recuperacion-password.use-case.ts`), no como segmento de path.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const passwordId = useId();
  const confirmacionId = useId();

  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enlaceInvalido, setEnlaceInvalido] = useState(token === "");
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErrorGeneral(null);

    const validacion = validarNuevaPassword({ passwordNueva, confirmacion });
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    setEnviando(true);
    const resultado = await restablecerPassword(construirPayloadResetPassword(token, passwordNueva));
    setEnviando(false);

    if (!resultado.ok) {
      if (resultado.error.detalles && resultado.error.detalles.length > 0) {
        setErrores((actual) => ({ ...actual, ...mapearErroresValidacionPassword(resultado.error.detalles) }));
      }
      setErrorGeneral(resultado.error.message);
      // 409 CONFLICT (`TokenRecuperacionInvalidoError`) — enlace vencido/ya usado (CU-002 7a).
      setEnlaceInvalido(resultado.error.error === "CONFLICT");
      return;
    }

    navigate("/login", {
      replace: true,
      state: { mensajeExito: "Tu contraseña fue actualizada. Iniciá sesión con tu nueva contraseña." },
    });
  }

  if (enlaceInvalido) {
    return (
      <main className="login-page">
        <h1>Restablecer contraseña</h1>
        <p className="login-page__error" role="alert">
          {errorGeneral ?? MENSAJE_ENLACE_INVALIDO}
        </p>
        <p>
          <Link to="/forgot-password">Solicitar un enlace nuevo</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="login-page">
      <h1>Restablecer contraseña</h1>
      <form className="login-page__form" onSubmit={manejarEnvio} noValidate>
        <div className="campo">
          <label htmlFor={passwordId}>Nueva contraseña</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            value={passwordNueva}
            disabled={enviando}
            onChange={(evento) => setPasswordNueva(evento.target.value)}
          />
          {errores.password_nueva ? <span className="campo-error">{errores.password_nueva}</span> : null}
        </div>
        <div className="campo">
          <label htmlFor={confirmacionId}>Confirmar nueva contraseña</label>
          <input
            id={confirmacionId}
            type="password"
            autoComplete="new-password"
            required
            value={confirmacion}
            disabled={enviando}
            onChange={(evento) => setConfirmacion(evento.target.value)}
          />
          {errores.confirmacion ? <span className="campo-error">{errores.confirmacion}</span> : null}
        </div>
        {errorGeneral ? (
          <p className="login-page__error" role="alert">
            {errorGeneral}
          </p>
        ) : null}
        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Restablecer contraseña"}
        </button>
      </form>
    </main>
  );
}
