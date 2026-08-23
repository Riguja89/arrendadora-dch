import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { MultimediaConfig } from "../../../../config/configuration";
import type { VarianteImagen } from "../../domain/rules/multimedia-constantes";
import type {
  AlmacenamientoObjetosPort,
  ObjetoVariante,
} from "../../domain/ports/almacenamiento-objetos.port";

/**
 * Adaptador **S3** del `AlmacenamientoObjetosPort` (ADR-008) — producción y dev sobre LocalStack
 * (S3 emulado, `MULTIMEDIA_STORAGE_DRIVER=s3`). Sube/elimina los binarios de las variantes de una
 * foto contra un bucket S3-compatible y calcula la URL pública path-style. Credenciales/bucket/
 * región/endpoint SIEMPRE desde `ConfigService` — nunca hardcodeados (DEI, secrets-scan).
 */
@Injectable()
export class S3AlmacenamientoAdapter implements AlmacenamientoObjetosPort {
  private readonly logger = new Logger(S3AlmacenamientoAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(configService: ConfigService) {
    const config = configService.get<MultimediaConfig>("multimedia");
    this.bucket = config?.s3Bucket ?? "";
    this.endpoint = (config?.s3Endpoint ?? "").replace(/\/+$/, "");
    this.client = new S3Client({
      endpoint: config?.s3Endpoint,
      region: config?.s3Region,
      forcePathStyle: config?.s3ForcePathStyle,
      credentials: {
        accessKeyId: config?.s3AccessKeyId ?? "",
        secretAccessKey: config?.s3SecretAccessKey ?? "",
      },
    });
  }

  async subirVariantes(s3KeyBase: string, variantes: ObjetoVariante[]): Promise<void> {
    for (const variante of variantes) {
      const key = this.keyDe(s3KeyBase, variante.variante);
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: variante.datos,
          ContentType: variante.contentType,
          ACL: "public-read",
        }),
      );
    }
    this.logger.log(
      `[storage:s3] subida completada — base=${s3KeyBase} variantes=${variantes
        .map((v) => v.variante)
        .join(",")}`,
    );
  }

  async eliminarPrefijos(s3KeyBases: string[]): Promise<void> {
    if (s3KeyBases.length === 0) return;

    for (const prefijo of s3KeyBases) {
      const listado = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: `${prefijo}/` }),
      );
      const objetos = listado.Contents ?? [];
      if (objetos.length === 0) continue;

      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: objetos
              .filter((objeto) => objeto.Key !== undefined)
              .map((objeto) => ({ Key: objeto.Key as string })),
          },
        }),
      );
    }
    this.logger.log(`[storage:s3] eliminación completada — prefijos=${s3KeyBases.join(", ")}`);
  }

  urlDe(s3KeyBase: string, variante: VarianteImagen): string {
    return `${this.endpoint}/${this.bucket}/${this.keyDe(s3KeyBase, variante)}`;
  }

  private keyDe(s3KeyBase: string, variante: VarianteImagen): string {
    return `${s3KeyBase}/${variante}.webp`;
  }
}
