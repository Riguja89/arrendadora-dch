/**
 * Value Object Slug — URL amigable estable de una propiedad (RN-007). Se deriva del título y se
 * combina con el `codigo` (único) para garantizar unicidad sin consultar la base de datos:
 * `apartamento-en-chapinero-ap-001`.
 */
export class Slug {
  private constructor(private readonly valorSlug: string) {}

  /** Normaliza un texto a formato slug: minúsculas, sin tildes, separado por guiones. */
  static normalizar(texto: string): string {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // elimina diacríticos (tildes, diéresis)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // todo lo no alfanumérico → guion
      .replace(/^-+|-+$/g, "") // recorta guiones de los extremos
      .replace(/-{2,}/g, "-"); // colapsa guiones repetidos
  }

  /** Construye el slug único a partir del título y el código legible de la propiedad. */
  static desdeTitulo(titulo: string, codigo: string): Slug {
    const base = Slug.normalizar(titulo);
    const sufijo = Slug.normalizar(codigo);
    const combinado = base ? `${base}-${sufijo}` : sufijo;
    return new Slug(combinado);
  }

  static reconstituir(valor: string): Slug {
    return new Slug(valor);
  }

  get valor(): string {
    return this.valorSlug;
  }
}
