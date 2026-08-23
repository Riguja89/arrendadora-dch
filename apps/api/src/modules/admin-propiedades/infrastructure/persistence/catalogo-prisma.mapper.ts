import { CatalogoItem } from "../../domain/entities/catalogo-item.entity";

/** Fila común de un catálogo administrable (`tipos_propiedad` / `amenidades`). */
export interface CatalogoRow {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Mapeo compartido fila → dominio para ambos catálogos (misma forma, ADR-005). */
export function aCatalogoDominio(registro: CatalogoRow): CatalogoItem {
  return CatalogoItem.reconstituir({
    id: registro.id,
    nombre: registro.nombre,
    activo: registro.activo,
    orden: registro.orden,
    createdAt: registro.createdAt,
    updatedAt: registro.updatedAt,
  });
}

/** Datos de escritura compartidos (upsert) — misma forma para ambos catálogos. */
export function aCatalogoDatos(item: CatalogoItem): CatalogoRow {
  return { ...item.toProps() };
}
