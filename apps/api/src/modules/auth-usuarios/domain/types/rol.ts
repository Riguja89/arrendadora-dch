/** Roles del sistema (RN-035, RN-036, ADR-014). Exactamente un rol por usuario. */
export type Rol = "administrador" | "agente" | "editor";

export const ROLES_VALIDOS: readonly Rol[] = ["administrador", "agente", "editor"];

export function esRolValido(valor: string): valor is Rol {
  return (ROLES_VALIDOS as readonly string[]).includes(valor);
}

/** ADR-014 — solo el Administrador gestiona usuarios, catálogos y configuración. */
export function puedeGestionarUsuarios(rol: Rol): boolean {
  return rol === "administrador";
}
