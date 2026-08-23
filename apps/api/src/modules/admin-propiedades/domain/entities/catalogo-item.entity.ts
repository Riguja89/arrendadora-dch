/**
 * Entidad genérica de catálogo administrable (ADR-005). Modela por igual `tipos_propiedad` y
 * `amenidades`: ambos comparten forma (`id`, `nombre`, `activo`, `orden`) y comportamiento
 * (CRUD con borrado lógico). El tipo concreto lo distingue el puerto/repositorio, no la entidad.
 */
export interface CatalogoItemProps {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CatalogoItem {
  private constructor(private props: CatalogoItemProps) {}

  static reconstituir(props: CatalogoItemProps): CatalogoItem {
    return new CatalogoItem({ ...props });
  }

  /** Alta de un ítem de catálogo. Arranca activo. */
  static crear(input: { id: string; nombre: string; orden: number; ahora: Date }): CatalogoItem {
    return new CatalogoItem({
      id: input.id,
      nombre: input.nombre,
      activo: true,
      orden: input.orden,
      createdAt: input.ahora,
      updatedAt: input.ahora,
    });
  }

  /** Edición: nombre, orden y estado activo (solo se aplican los campos definidos). */
  editar(input: { nombre?: string; orden?: number; activo?: boolean }, ahora: Date): void {
    if (input.nombre !== undefined) this.props.nombre = input.nombre;
    if (input.orden !== undefined) this.props.orden = input.orden;
    if (input.activo !== undefined) this.props.activo = input.activo;
    this.props.updatedAt = ahora;
  }

  /** Borrado lógico (ADR-005) — no se elimina físicamente para no romper propiedades en uso. */
  desactivar(ahora: Date): void {
    this.props.activo = false;
    this.props.updatedAt = ahora;
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get activo(): boolean {
    return this.props.activo;
  }

  toProps(): Readonly<CatalogoItemProps> {
    return { ...this.props };
  }
}
