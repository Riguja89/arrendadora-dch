/**
 * Rol del actor autenticado, tal como lo expone `auth-usuarios` (upstream Customer/Supplier,
 * DESIGN-027). Se declara aquí como tipo propio para mantener el dominio de `admin-multimedia`
 * puro y auto-contenido (regla de pureza de dominio, ADR-001) — es estructuralmente idéntico a
 * `Rol` de auth-usuarios y a `RolActor` de `admin-propiedades`.
 */
export type RolActor = "administrador" | "agente" | "editor";

export interface Actor {
  id: string;
  rol: RolActor;
}
