export interface PasswordResetTokenProps {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiraEn: Date;
  usado: boolean;
  createdAt: Date;
}

/** Token de recuperación de contraseña (RN-019) — un solo uso, válido máximo 60 minutos. */
export class PasswordResetToken {
  private constructor(private props: PasswordResetTokenProps) {}

  static reconstituir(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken({ ...props });
  }

  static crear(input: {
    id: string;
    usuarioId: string;
    tokenHash: string;
    ahora: Date;
    ttlMinutos: number;
  }): PasswordResetToken {
    return new PasswordResetToken({
      id: input.id,
      usuarioId: input.usuarioId,
      tokenHash: input.tokenHash,
      usado: false,
      createdAt: input.ahora,
      expiraEn: new Date(input.ahora.getTime() + input.ttlMinutos * 60_000),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiraEn(): Date {
    return this.props.expiraEn;
  }
  get usado(): boolean {
    return this.props.usado;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** RN-019 — no usado y no vencido. */
  esValido(ahora: Date): boolean {
    return !this.props.usado && ahora.getTime() < this.props.expiraEn.getTime();
  }

  marcarUsado(): void {
    this.props.usado = true;
  }

  toProps(): Readonly<PasswordResetTokenProps> {
    return { ...this.props };
  }
}
