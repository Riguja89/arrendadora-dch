import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MultimediaConfig } from "../../../../config/configuration";
import type { VarianteImagen } from "../../domain/rules/multimedia-constantes";
import type {
  AlmacenamientoObjetosPort,
  ObjetoVariante,
} from "../../domain/ports/almacenamiento-objetos.port";

/**
 * Adaptador **local/no-op** del `AlmacenamientoObjetosPort` (ADR-008) — MVP/dev sin bucket S3 real,
 * y el que usan los tests para no depender de credenciales AWS. No persiste binarios: solo loguea la
 * subida/eliminación y calcula URLs deterministas a partir de `multimedia.cdnBaseUrl`. Reemplazable
 * por el adaptador S3+CloudFront cambiando solo el binding del módulo (mismo patrón que
 * `LogEmailSenderAdapter` en auth-usuarios). Selección por env `MULTIMEDIA_STORAGE_DRIVER`.
 */
@Injectable()
export class LocalAlmacenamientoAdapter implements AlmacenamientoObjetosPort {
  private readonly logger = new Logger(LocalAlmacenamientoAdapter.name);
  private readonly cdnBaseUrl: string;

  constructor(configService: ConfigService) {
    const config = configService.get<MultimediaConfig>("multimedia");
    this.cdnBaseUrl = (config?.cdnBaseUrl ?? "http://localhost:3000/media").replace(/\/+$/, "");
  }

  async subirVariantes(s3KeyBase: string, variantes: ObjetoVariante[]): Promise<void> {
    this.logger.log(
      `[storage:local] subida omitida (sin proveedor real, ADR-008 MVP) — base=${s3KeyBase} variantes=${variantes
        .map((v) => v.variante)
        .join(",")}`,
    );
  }

  async eliminarPrefijos(s3KeyBases: string[]): Promise<void> {
    if (s3KeyBases.length === 0) return;
    this.logger.log(`[storage:local] eliminación omitida (sin proveedor real) — prefijos=${s3KeyBases.join(", ")}`);
  }

  urlDe(s3KeyBase: string, variante: VarianteImagen): string {
    return `${this.cdnBaseUrl}/${s3KeyBase}/${variante}.webp`;
  }
}
