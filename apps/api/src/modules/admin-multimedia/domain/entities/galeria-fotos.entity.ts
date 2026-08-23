import { Foto } from "./foto.entity";
import type { FormatoImagen } from "../value-objects/formato-imagen.vo";
import { MAX_FOTOS_POR_PROPIEDAD, MIN_FOTOS_PROPIEDAD_VISIBLE } from "../rules/multimedia-constantes";
import {
  FotoNoEncontradaError,
  MaximoFotosExcedidoError,
  OrdenFotosInvalidoError,
  UltimaFotoPropiedadVisibleError,
} from "../errors/dominio-multimedia.errors";

/** Datos de una foto ya subida al almacenamiento, lista para incorporarse a la galería. */
export interface FotoSubida {
  id: string;
  s3KeyBase: string;
  formatoOriginal: FormatoImagen;
}

/**
 * Aggregate raíz de la multimedia: la **galería de fotos de una propiedad**. Mantiene las
 * invariantes de conjunto que ninguna `Foto` individual puede garantizar por sí sola (ADR-008):
 *
 * - `orden` contiguo `1..N` según la posición en la lista (RN-031).
 * - **una sola** foto marcada como portada (RN-014); la portada es siempre la primera del orden.
 * - máximo 10 fotos (GAP-001); al eliminar la portada, la siguiente en orden pasa a portada (RN-032).
 *
 * La multimedia es composición de `Propiedad` (DESIGN-027): la galería se identifica por
 * `propiedadId` y no existe fuera de su propiedad.
 */
export class GaleriaFotos {
  private constructor(
    public readonly propiedadId: string,
    private items: Foto[],
  ) {
    this.normalizar(new Date(0));
  }

  /** Reconstruye la galería desde persistencia y la ordena por `orden`. No toca `updatedAt`. */
  static reconstituir(propiedadId: string, fotos: Foto[]): GaleriaFotos {
    const ordenadas = [...fotos].sort((a, b) => a.orden - b.orden);
    const galeria = new GaleriaFotos(propiedadId, ordenadas);
    return galeria;
  }

  /** Galería vacía (propiedad sin fotos aún). */
  static vacia(propiedadId: string): GaleriaFotos {
    return new GaleriaFotos(propiedadId, []);
  }

  /**
   * CU-001 — incorpora las fotos ya subidas al final de la galería (RN-028). Rechaza en bloque si
   * excediera el máximo de 10 (ADR-008, 409). Si la galería estaba vacía, la primera foto agregada
   * queda como portada (RN-014). Devuelve las nuevas entidades `Foto` creadas, en orden.
   */
  agregar(subidas: FotoSubida[], ahora: Date): Foto[] {
    if (subidas.length === 0) {
      return [];
    }
    if (this.items.length + subidas.length > MAX_FOTOS_POR_PROPIEDAD) {
      throw new MaximoFotosExcedidoError();
    }
    const nuevas = subidas.map((s) =>
      Foto.crear({
        id: s.id,
        propiedadId: this.propiedadId,
        s3KeyBase: s.s3KeyBase,
        formatoOriginal: s.formatoOriginal,
        ahora,
      }),
    );
    this.items.push(...nuevas);
    this.normalizar(ahora);
    return nuevas;
  }

  /**
   * CU-002 / RN-031 — reordena la galería según `idsEnOrden`, que debe contener exactamente las
   * fotos actuales (misma cantidad, sin repetidos ni faltantes). La portada se mantiene en la foto
   * marcada, reubicada a su nueva posición; el `orden` se recalcula 1..N.
   */
  reordenar(idsEnOrden: string[], ahora: Date): void {
    const actuales = new Set(this.items.map((f) => f.id));
    const nuevos = new Set(idsEnOrden);
    if (idsEnOrden.length !== this.items.length || nuevos.size !== idsEnOrden.length) {
      throw new OrdenFotosInvalidoError();
    }
    for (const id of idsEnOrden) {
      if (!actuales.has(id)) {
        throw new OrdenFotosInvalidoError();
      }
    }
    const porId = new Map(this.items.map((f) => [f.id, f]));
    this.items = idsEnOrden.map((id) => porId.get(id) as Foto);
    this.normalizar(ahora);
  }

  /** RN-014 — marca `fotoId` como portada única y la mueve al inicio del orden. */
  marcarPortada(fotoId: string, ahora: Date): void {
    const foto = this.items.find((f) => f.id === fotoId);
    if (!foto) {
      throw new FotoNoEncontradaError();
    }
    this.items = [foto, ...this.items.filter((f) => f.id !== fotoId)];
    this.normalizar(ahora);
  }

  /**
   * RN-032 — elimina una foto. Si era la portada, la siguiente en orden pasa a portada
   * automáticamente (lo garantiza `normalizar`). No permite dejar en 0 fotos a una propiedad
   * visible en el portal (ADR-008). Devuelve la `Foto` eliminada (para purgar su binario en S3).
   */
  eliminar(fotoId: string, propiedadVisible: boolean, ahora: Date): Foto {
    const foto = this.items.find((f) => f.id === fotoId);
    if (!foto) {
      throw new FotoNoEncontradaError();
    }
    if (propiedadVisible && this.items.length <= MIN_FOTOS_PROPIEDAD_VISIBLE) {
      throw new UltimaFotoPropiedadVisibleError();
    }
    this.items = this.items.filter((f) => f.id !== fotoId);
    this.normalizar(ahora);
    return foto;
  }

  /** Fotos de la galería en orden de visualización (portada primero). */
  fotos(): readonly Foto[] {
    return [...this.items];
  }

  /**
   * Reasienta el invariante de conjunto: `orden` contiguo 1..N según la posición en `items` y una
   * sola portada (la primera de la lista). Solo las fotos cuyo estado cambió tocan su `updatedAt`.
   */
  private normalizar(ahora: Date): void {
    this.items.forEach((foto, indice) => {
      foto.aplicarPosicion(indice + 1, indice === 0, ahora);
    });
  }
}
