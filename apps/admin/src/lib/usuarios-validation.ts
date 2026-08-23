import type { DetalleErrorCampo, RolUsuario, Usuario, UsuarioCrear, UsuarioEditar } from "@arrendadora/shared";

/**
 * Validación cliente del formulario de usuario (spec-005 CU-003/CU-004; contrato
 * `UsuarioCrear`/`UsuarioEditar`, DESIGN-028). Espejo *no autoritativo* del backend
 * (`crear-usuario.dto.ts`/`editar-usuario.dto.ts`) — el servidor sigue siendo la fuente de
 * verdad (422 `ErrorValidacion`, 409 email duplicado).
 *
 * Nota — RN-038 (WhatsApp obligatorio para Agente) quedó *superseded* por GAP-002 (Modelo B,
 * WhatsApp central en `ConfiguracionSistema`): el backend (`crear-usuario.dto.ts`,
 * `editar-usuario.dto.ts`) trata `whatsapp` como opcional para cualquier rol, sin validar
 * formato. Esta validación no reintroduce esa regla — ver `apps/admin/CLAUDE.md` y
 * `apps/api/src/modules/auth-usuarios/CLAUDE.md` ("RN-038 superseded").
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valores crudos del formulario — todos como string porque vienen de inputs controlados. */
export interface UsuarioFormValues {
  nombre: string;
  email: string;
  rol: RolUsuario | "";
  whatsapp: string;
}

export interface ResultadoValidacionUsuario {
  valido: boolean;
  errores: Record<string, string>;
}

/** Valida los campos del contrato `UsuarioCrear` (nombre, email, rol) — spec-005 CU-003. */
export function validarFormularioUsuario(valores: UsuarioFormValues): ResultadoValidacionUsuario {
  const errores: Record<string, string> = {};

  if (valores.nombre.trim().length === 0) errores.nombre = "El nombre es obligatorio.";

  if (valores.email.trim().length === 0) {
    errores.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(valores.email.trim())) {
    errores.email = "Ingresá un correo electrónico válido.";
  }

  if (valores.rol === "") errores.rol = "Seleccioná un rol.";

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Arma el payload `UsuarioCrear` a partir de valores ya validados (CU-003). */
export function construirPayloadCrearUsuario(valores: UsuarioFormValues): UsuarioCrear {
  return {
    nombre: valores.nombre.trim(),
    email: valores.email.trim(),
    rol: valores.rol as RolUsuario,
    whatsapp: valores.whatsapp.trim() === "" ? null : valores.whatsapp.trim(),
  };
}

/** Arma el payload `UsuarioEditar` — sin `email` (no editable, ANALYZE-005) (CU-004). */
export function construirPayloadEditarUsuario(valores: UsuarioFormValues): UsuarioEditar {
  return {
    nombre: valores.nombre.trim(),
    rol: valores.rol as RolUsuario,
    whatsapp: valores.whatsapp.trim() === "" ? null : valores.whatsapp.trim(),
  };
}

/** Valores iniciales del formulario — vacíos para crear, prellenados para editar. */
export function valoresInicialesUsuario(usuario?: Usuario): UsuarioFormValues {
  if (!usuario) {
    return { nombre: "", email: "", rol: "", whatsapp: "" };
  }

  return {
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    whatsapp: usuario.whatsapp ?? "",
  };
}

/** Mapea `ErrorValidacion.detalles[]` (422, campos snake_case del wire) a errores por campo del form. */
export function mapearErroresValidacionUsuario(detalles: DetalleErrorCampo[] | undefined): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const detalle of detalles ?? []) {
    errores[detalle.campo] = detalle.mensaje;
  }
  return errores;
}
