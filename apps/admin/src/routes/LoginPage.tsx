import { useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

interface EstadoNavegacionLogin {
  from?: { pathname: string };
  /** Mensaje de confirmación tras un flujo previo (ej. reset/cambio de contraseña exitoso). */
  mensajeExito?: string;
}

/** CU-001 — inicio de sesión con email + contraseña (RN-020, sin OAuth social). */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const estadoOrigen = location.state as EstadoNavegacionLogin | null;
  const destinoTrasLogin = estadoOrigen?.from?.pathname ?? "/dashboard";
  const mensajeExito = estadoOrigen?.mensajeExito ?? null;

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await login(email, password);

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error?.message ?? "No se pudo iniciar sesión. Intentá de nuevo.");
      return;
    }

    navigate(destinoTrasLogin, { replace: true });
  }

  return (
    <main className="login-page">
      <h1>Arrendadora — Panel admin</h1>
      {mensajeExito ? (
        <p className="login-page__exito" role="status">
          {mensajeExito}
        </p>
      ) : null}
      <form className="login-page__form" onSubmit={manejarEnvio} noValidate>
        <div className="campo">
          <label htmlFor={emailId}>Correo electrónico</label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            disabled={enviando}
            onChange={(evento) => setEmail(evento.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor={passwordId}>Contraseña</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={enviando}
            onChange={(evento) => setPassword(evento.target.value)}
          />
        </div>
        {error ? (
          <p className="login-page__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <p>
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>
    </main>
  );
}
