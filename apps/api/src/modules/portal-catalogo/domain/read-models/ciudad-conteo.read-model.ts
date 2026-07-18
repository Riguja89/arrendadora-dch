/**
 * Ciudad con al menos una propiedad visible y su conteo, para poblar el filtro de ciudad del
 * catálogo (contrato DESIGN-029 `/public/ciudades`, GAP-002). Lista dinámica derivada de las
 * propiedades publicadas.
 */
export interface CiudadConteo {
  ciudad: string;
  total: number;
}
