import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { cambiarPassword } from "@/lib/password-api";
import {
  construirPayloadCambioPassword,
  mapearErroresValidacionPassword,
  validarCambioPassword,
} from "@/lib/password-validation";

/**
 * Cambio de contraseña autenticado (`POST /auth/change-password`). Cubre tanto el cambio
 * voluntario como el forzado (GAP-004): cuando la sesión trae `requiereCambioPassword=true`
 * (alta con contraseña temporal), `RequireAuth` intercepta cualquier otra ruta autenticada y
 * redirige acá. El backend siempre exige `password_actual` (`ChangePasswordDto` no tiene una
 * variante sin ese campo) — en el cambio forzado, esa "contraseña actual" es la temporal que el
 * Administrador le compartió al usuario al crearlo.
 *
 * Al confirmar, el backend revoca TODAS las sesiones, incluida la actual (decisión documentada
 * en `cambiar-password.use-case.ts` / `apps/api/.../auth-usuarios/CLAUDE.md`) — el cliente cierra
 * sesión localmente (`logout()`, que ya limpia el estado aunque el `/auth/logout` responda 401
 * por sesión ya revocada) y redirige a `/login`.
 */
export function CambiarPasswordPage() {
  const { requiereCambioPassword, logout } = useAuth();
  const navigate = useNavigate();

  const actualId = useId();
  const nuevaId = useId();
  const confirmacionId = useId();

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErrorGeneral(null);

    const valores = { passwordActual, passwordNueva, confirmacion };
    const validacion = validarCambioPassword(valores);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    setEnviando(true);
    const resultado = await cambiarPassword(construirPayloadCambioPassword(valores));

    if (!resultado.ok) {
      setEnviando(false);
      if (resultado.error.detalles && resultado.error.detalles.length > 0) {
        setErrores((actual) => ({ ...actual, ...mapearErroresValidacionPassword(resultado.error.detalles) }));
      }
      setErrorGeneral(resultado.error.message);
      return;
    }

    await logout();
    navigate("/login", {
      replace: true,
      state: { mensajeExito: "Tu contraseña fue actualizada. Iniciá sesión de nuevo." },
    });
  }

  return (
    <section>
      <h2>Cambiar contraseña</h2>
      {requiereCambioPassword ? (
        <p className="admin-layout__aviso" role="status">
          Tu cuenta tiene una contraseña temporal asignada por el Administrador. Cambiala para continuar.
        </p>
      ) : null}
      <form className="usuario-form" onSubmit={manejarEnvio} noValidate>
        <div className="campo">
          <label htmlFor={actualId}>Contraseña actual</label>
          <input
            id={actualId}
            type="password"
            autoComplete="current-password"
            required
            value={passwordActual}
            disabled={enviando}
            onChange={(evento) => setPasswordActual(evento.target.value)}
          />
          {errores.password_actual ? <span className="campo-error">{errores.password_actual}</span> : null}
        </div>
        <div className="campo">
          <label htmlFor={nuevaId}>Nueva contraseña</label>
          <input
            id={nuevaId}
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
          <p className="campo-error" role="alert">
            {errorGeneral}
          </p>
        ) : null}
        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}
