import { CrearPropiedadDto } from "./crear-propiedad.dto";

/**
 * PUT /admin/propiedades/{id} — cuerpo de edición (`PropiedadEditar`, DESIGN-028): mismos campos
 * que la creación (el estado se gestiona por `PATCH .../estado`). La reasignación de `agente_id`
 * solo la honra el caso de uso para el Administrador (RN-016).
 */
export class EditarPropiedadDto extends CrearPropiedadDto {}
