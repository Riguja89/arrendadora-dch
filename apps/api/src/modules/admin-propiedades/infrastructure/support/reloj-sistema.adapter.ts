import { Injectable } from "@nestjs/common";
import type { RelojPort } from "../../domain/ports/reloj.port";

@Injectable()
export class RelojSistemaAdapter implements RelojPort {
  ahora(): Date {
    return new Date();
  }
}
