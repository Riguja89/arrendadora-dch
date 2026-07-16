import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { IdGeneratorPort } from "../../domain/ports/id-generator.port";

/** Genera UUIDs con la API nativa de Node. Los ids se asignan en la capa de aplicación. */
@Injectable()
export class CryptoIdGeneratorAdapter implements IdGeneratorPort {
  nuevo(): string {
    return randomUUID();
  }
}
