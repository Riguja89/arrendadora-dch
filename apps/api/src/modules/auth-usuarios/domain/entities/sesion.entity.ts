export interface SesionProps {
  id: string;
  usuarioId: string;
  expiraEn: Date;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Sesión server-side (ADR-004) — cookie opaca `sid`. TTL deslizante: cada request autenticado
 * renueva `expiraEn`. Logout/desactivación/bloqueo la revocan borrando el registro.
 */
export class Sesion {
  private constructor(private props: SesionProps) {}

  static reconstituir(props: SesionProps): Sesion {
    return new Sesion({ ...props });
  }

  static crear(input: {
    id: string;
    usuarioId: string;
    ip: string | null;
    userAgent: string | null;
    ahora: Date;
    ttlMinutos: number;
  }): Sesion {
    return new Sesion({
      id: input.id,
      usuarioId: input.usuarioId,
      ip: input.ip,
      userAgent: input.userAgent,
      createdAt: input.ahora,
      expiraEn: sumarMinutos(input.ahora, input.ttlMinutos),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
  get expiraEn(): Date {
    return this.props.expiraEn;
  }
  get ip(): string | null {
    return this.props.ip;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  estaExpirada(ahora: Date): boolean {
    return ahora.getTime() >= this.props.expiraEn.getTime();
  }

  /** Sliding TTL (GAP-005) — cada request autenticado renueva la expiración. */
  renovar(ahora: Date, ttlMinutos: number): void {
    this.props.expiraEn = sumarMinutos(ahora, ttlMinutos);
  }

  toProps(): Readonly<SesionProps> {
    return { ...this.props };
  }
}

function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000);
}
