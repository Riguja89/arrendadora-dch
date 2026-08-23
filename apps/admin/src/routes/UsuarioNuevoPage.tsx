import { useState } from "react";
import { Link } from "react-router-dom";
import type { Usuario } from "@arrendadora/shared";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";

/**
 * CU-003 — creación de usuario interno (HU-003). A diferencia de `PropiedadNuevaPage`, no
 * navega automáticamente al guardar: el backend devuelve una contraseña temporal una única vez
 * (GAP-004 opción A) que el Administrador debe poder copiar antes de salir de la pantalla.
 */
export function UsuarioNuevaPage() {
  const [creado, setCreado] = useState<Usuario | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  if (creado && passwordTemporal) {
    return (
      <section>
        <h2>Usuario creado</h2>
        <p>
          <strong>{creado.nombre}</strong> ({creado.email}) fue creado con estado activo.
        </p>
        <p className="usuario-nuevo__password">
          Contraseña temporal: <code>{passwordTemporal}</code>
        </p>
        <p className="texto-muted">
          Compartí esta contraseña con el usuario — no se mostrará de nuevo. Deberá cambiarla en su primer inicio de sesión.
        </p>
        <p>
          <Link to={`/usuarios/${creado.id}/editar`}>Editar este usuario</Link> ·{" "}
          <Link to="/usuarios">Volver al listado</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>Nuevo usuario</h2>
      <UsuarioForm modo="crear" onGuardado={setCreado} onPasswordTemporal={setPasswordTemporal} />
    </section>
  );
}
