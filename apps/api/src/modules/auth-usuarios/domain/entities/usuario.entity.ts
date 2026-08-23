import type { Rol } from "../types/rol";
import type { EstadoUsuario } from "../types/estado-usuario";

export interface UsuarioProps {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  estado: EstadoUsuario;
  whatsapp: string | null;
  intentosFallidos: number;
  requiereCambioPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate raíz Usuario (ANALYZE-005, ERD DESIGN-026). Sin dependencias de framework ni de
 * infraestructura (regla de pureza de dominio, ADR-001) — Prisma/Nest quedan detrás de los
 * puertos y del mapper de infraestructura.
 */
export class Usuario {
  private constructor(private props: UsuarioProps) {}

  /** Reconstruye una instancia desde persistencia — no valida invariantes de creación. */
  static reconstituir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  /** CU-003 — alta de un usuario nuevo. Arranca `activo`, sin intentos fallidos. */
  static crear(input: {
    id: string;
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Rol;
    whatsapp: string | null;
    ahora: Date;
  }): Usuario {
    return new Usuario({
      id: input.id,
      nombre: input.nombre,
      email: input.email,
      passwordHash: input.passwordHash,
      rol: input.rol,
      estado: "activo",
      whatsapp: input.whatsapp,
      intentosFallidos: 0,
      // GAP-004 opción A — password temporal fijada por el Administrador; el usuario la
      // cambia en su primer login.
      requiereCambioPassword: true,
      createdAt: input.ahora,
      updatedAt: input.ahora,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get rol(): Rol {
    return this.props.rol;
  }
  get estado(): EstadoUsuario {
    return this.props.estado;
  }
  get whatsapp(): string | null {
    return this.props.whatsapp;
  }
  get intentosFallidos(): number {
    return this.props.intentosFallidos;
  }
  get requiereCambioPassword(): boolean {
    return this.props.requiereCambioPassword;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  estaActivo(): boolean {
    return this.props.estado === "activo";
  }
  estaBloqueado(): boolean {
    return this.props.estado === "bloqueado";
  }
  estaDesactivado(): boolean {
    return this.props.estado === "desactivado";
  }

  /** CU-001 4b/RN — incrementa el contador; al llegar al máximo, bloqueo permanente (ADR-004). */
  registrarIntentoFallido(maxIntentos: number, ahora: Date): void {
    this.props.intentosFallidos += 1;
    if (this.props.intentosFallidos >= maxIntentos) {
      this.props.estado = "bloqueado";
    }
    this.tocar(ahora);
  }

  /** Login exitoso — resetea el contador de intentos fallidos. */
  registrarIntentoExitoso(ahora: Date): void {
    this.props.intentosFallidos = 0;
    this.tocar(ahora);
  }

  /** CU-004 3b — reactivación de un usuario desactivado. */
  activar(ahora: Date): void {
    this.props.estado = "activo";
    this.tocar(ahora);
  }

  /** CU-004 3a — desactivación (RN-037: impide login de inmediato). */
  desactivar(ahora: Date): void {
    this.props.estado = "desactivado";
    this.tocar(ahora);
  }

  /** ADR-004 — solo el Administrador desbloquea; resetea el contador de intentos. */
  desbloquear(ahora: Date): void {
    this.props.estado = "activo";
    this.props.intentosFallidos = 0;
    this.tocar(ahora);
  }

  /** Cambio de contraseña (propio o por reset) — limpia el flag de cambio obligatorio. */
  cambiarPassword(nuevoHash: string, ahora: Date): void {
    this.props.passwordHash = nuevoHash;
    this.props.requiereCambioPassword = false;
    this.tocar(ahora);
  }

  /** CU-004 — edición de perfil (email no editable, ANALYZE-005). */
  editarPerfil(input: { nombre?: string; rol?: Rol; whatsapp?: string | null }, ahora: Date): void {
    if (input.nombre !== undefined) this.props.nombre = input.nombre;
    if (input.rol !== undefined) this.props.rol = input.rol;
    if (input.whatsapp !== undefined) this.props.whatsapp = input.whatsapp;
    this.tocar(ahora);
  }

  private tocar(ahora: Date): void {
    this.props.updatedAt = ahora;
  }

  toProps(): Readonly<UsuarioProps> {
    return { ...this.props };
  }
}
