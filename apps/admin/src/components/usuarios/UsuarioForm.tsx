import { useId, useState, type FormEvent } from "react";
import type { RolUsuario, Usuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import { crearUsuario, editarUsuario } from "@/lib/usuarios-api";
import {
  construirPayloadCrearUsuario,
  construirPayloadEditarUsuario,
  mapearErroresValidacionUsuario,
  valoresInicialesUsuario,
  validarFormularioUsuario,
  type UsuarioFormValues,
} from "@/lib/usuarios-validation";
import { ETIQUETAS_ROL } from "@/lib/estados-usuario";

interface UsuarioFormProps {
  modo: "crear" | "editar";
  usuario?: Usuario;
  onGuardado: (usuario: Usuario) => void;
  /** Solo se invoca en modo "crear" — GAP-004 opción A (el backend devuelve la contraseña una única vez). */
  onPasswordTemporal?: (passwordTemporal: string) => void;
}

const ROLES: RolUsuario[] = ["administrador", "agente", "editor"];

/**
 * Formulario compartido de creación/edición de usuario (spec-005 CU-003, CU-004). El email
 * **no es editable** (ANALYZE-005) — en modo "editar" el campo se muestra deshabilitado. El rol
 * tampoco es editable cuando el usuario en edición es la propia sesión (auto-protección,
 * CU-004 5a, `AutoproteccionAdministradorError`) — el backend rechaza ese cambio con 409, esto
 * solo evita el viaje de red y explica la razón en la UI.
 *
 * El campo WhatsApp es opcional para cualquier rol: RN-038 (obligatorio para Agente) quedó
 * *superseded* por GAP-002 (Modelo B — WhatsApp central), ver `usuarios-validation.ts`.
 */
export function UsuarioForm({ modo, usuario, onGuardado, onPasswordTemporal }: UsuarioFormProps) {
  const { usuario: usuarioSesion } = useAuth();
  const idBase = useId();

  const [valores, setValores] = useState<UsuarioFormValues>(() => valoresInicialesUsuario(usuario));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esUsuarioActual = modo === "editar" && usuario !== undefined && usuario.id === usuarioSesion?.id;

  function actualizarCampo<K extends keyof UsuarioFormValues>(campo: K, valor: UsuarioFormValues[K]): void {
    setValores((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErrorGeneral(null);

    const validacion = validarFormularioUsuario(valores);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    setEnviando(true);

    // Ramas separadas (no un `resultado` unificado): `crearUsuario`/`editarUsuario` devuelven
    // shapes distintos (`UsuarioCreado` trae `password_temporal`, GAP-004) y unificarlos en un
    // solo `const resultado = modo === "crear" ? ... : ...` amplía `data` a la unión de ambos
    // tipos, perdiendo el campo aditivo en el chequeo de tipos.
    if (modo === "crear") {
      const resultado = await crearUsuario(construirPayloadCrearUsuario(valores));
      setEnviando(false);
      if (!resultado.ok) {
        if (resultado.error.detalles && resultado.error.detalles.length > 0) {
          setErrores((actual) => ({ ...actual, ...mapearErroresValidacionUsuario(resultado.error.detalles) }));
        }
        setErrorGeneral(resultado.error.message);
        return;
      }
      onPasswordTemporal?.(resultado.data.password_temporal);
      onGuardado(resultado.data);
      return;
    }

    const resultado = await editarUsuario((usuario as Usuario).id, construirPayloadEditarUsuario(valores));
    setEnviando(false);
    if (!resultado.ok) {
      if (resultado.error.detalles && resultado.error.detalles.length > 0) {
        setErrores((actual) => ({ ...actual, ...mapearErroresValidacionUsuario(resultado.error.detalles) }));
      }
      setErrorGeneral(resultado.error.message);
      return;
    }
    onGuardado(resultado.data);
  }

  return (
    <form className="usuario-form" onSubmit={manejarEnvio} noValidate>
      <div className="campo">
        <label htmlFor={`${idBase}-nombre`}>Nombre completo</label>
        <input
          id={`${idBase}-nombre`}
          value={valores.nombre}
          disabled={enviando}
          onChange={(e) => actualizarCampo("nombre", e.target.value)}
        />
        {errores.nombre ? <span className="campo-error">{errores.nombre}</span> : null}
      </div>

      <div className="campo">
        <label htmlFor={`${idBase}-email`}>Correo electrónico</label>
        <input
          id={`${idBase}-email`}
          type="email"
          value={valores.email}
          disabled={enviando || modo === "editar"}
          onChange={(e) => actualizarCampo("email", e.target.value)}
        />
        {modo === "editar" ? <span className="texto-muted">El correo electrónico no es editable.</span> : null}
        {errores.email ? <span className="campo-error">{errores.email}</span> : null}
      </div>

      <div className="campo">
        <label htmlFor={`${idBase}-rol`}>Rol</label>
        <select
          id={`${idBase}-rol`}
          value={valores.rol}
          disabled={enviando || esUsuarioActual}
          onChange={(e) => actualizarCampo("rol", e.target.value as UsuarioFormValues["rol"])}
        >
          <option value="">Seleccioná…</option>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETAS_ROL[rol]}
            </option>
          ))}
        </select>
        {esUsuarioActual ? (
          <span className="texto-muted">No podés modificar tu propio rol (CU-004).</span>
        ) : null}
        {errores.rol ? <span className="campo-error">{errores.rol}</span> : null}
      </div>

      <div className="campo">
        <label htmlFor={`${idBase}-whatsapp`}>WhatsApp (opcional)</label>
        <input
          id={`${idBase}-whatsapp`}
          value={valores.whatsapp}
          disabled={enviando}
          placeholder="Ej. +57 310 500 1234"
          onChange={(e) => actualizarCampo("whatsapp", e.target.value)}
        />
        {errores.whatsapp ? <span className="campo-error">{errores.whatsapp}</span> : null}
      </div>

      {errorGeneral ? (
        <p className="campo-error" role="alert">
          {errorGeneral}
        </p>
      ) : null}

      <button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : modo === "crear" ? "Crear usuario" : "Guardar cambios"}
      </button>
    </form>
  );
}
