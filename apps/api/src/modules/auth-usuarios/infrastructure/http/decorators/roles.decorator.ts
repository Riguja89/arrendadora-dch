import { SetMetadata } from "@nestjs/common";
import type { Rol } from "../../../domain/types/rol";

export const ROLES_KEY = "roles";

/** Marca un handler con los roles autorizados (ADR-014). Requiere `SessionAuthGuard` antes. */
export const Roles = (...roles: Rol[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
