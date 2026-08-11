import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { S3AlmacenamientoAdapter } from "./s3-almacenamiento.adapter";
import type { ObjetoVariante } from "../../domain/ports/almacenamiento-objetos.port";
import type { MultimediaConfig } from "../../../../config/configuration";

const send = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({ send })),
    PutObjectCommand: vi.fn().mockImplementation((input) => ({ __type: "PutObjectCommand", input })),
    ListObjectsV2Command: vi
      .fn()
      .mockImplementation((input) => ({ __type: "ListObjectsV2Command", input })),
    DeleteObjectsCommand: vi
      .fn()
      .mockImplementation((input) => ({ __type: "DeleteObjectsCommand", input })),
    DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ __type: "DeleteObjectCommand", input })),
  };
});

const CONFIG: MultimediaConfig = {
  storageDriver: "s3",
  cdnBaseUrl: "http://localhost:3000/media",
  s3Bucket: "arrendadora-multimedia-dev",
  s3Region: "us-east-1",
  s3Endpoint: "http://localhost:4566",
  s3ForcePathStyle: true,
  s3AccessKeyId: "test",
  s3SecretAccessKey: "test",
};

function buildConfigService(overrides: Partial<MultimediaConfig> = {}): ConfigService {
  const multimedia = { ...CONFIG, ...overrides };
  return { get: vi.fn().mockReturnValue(multimedia) } as unknown as ConfigService;
}

function build(overrides: Partial<MultimediaConfig> = {}) {
  return new S3AlmacenamientoAdapter(buildConfigService(overrides));
}

describe("S3AlmacenamientoAdapter", () => {
  beforeEach(() => {
    // clearAllMocks (no reset) para preservar las mockImplementation de los constructores de comando
    // definidas en vi.mock arriba, pero limpiar el historial de llamadas entre tests.
    vi.clearAllMocks();
  });

  describe("subirVariantes", () => {
    it("emite un PutObject por variante con la Key, bucket y ContentType correctos", async () => {
      send.mockResolvedValue({});
      const adapter = build();
      const variantes: ObjetoVariante[] = [
        { variante: "original", datos: Buffer.from("a"), contentType: "image/webp" },
        { variante: "card", datos: Buffer.from("b"), contentType: "image/webp" },
        { variante: "thumbnail", datos: Buffer.from("c"), contentType: "image/webp" },
      ];

      await adapter.subirVariantes("propiedades/p-1/foto-1", variantes);

      expect(PutObjectCommand).toHaveBeenCalledTimes(3);
      expect(send).toHaveBeenCalledTimes(3);

      const inputs = (PutObjectCommand as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
        (call) => call[0],
      );
      expect(inputs).toEqual([
        expect.objectContaining({
          Bucket: "arrendadora-multimedia-dev",
          Key: "propiedades/p-1/foto-1/original.webp",
          ContentType: "image/webp",
          ACL: "public-read",
        }),
        expect.objectContaining({
          Bucket: "arrendadora-multimedia-dev",
          Key: "propiedades/p-1/foto-1/card.webp",
          ContentType: "image/webp",
        }),
        expect.objectContaining({
          Bucket: "arrendadora-multimedia-dev",
          Key: "propiedades/p-1/foto-1/thumbnail.webp",
          ContentType: "image/webp",
        }),
      ]);
    });

    it("respeta el content-type que trae cada variante", async () => {
      send.mockResolvedValue({});
      const adapter = build();
      const variantes: ObjetoVariante[] = [
        { variante: "original", datos: Buffer.from("a"), contentType: "image/png" },
      ];

      await adapter.subirVariantes("propiedades/p-1/foto-2", variantes);

      const input = (PutObjectCommand as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(input.ContentType).toBe("image/png");
      // La key SIEMPRE usa .webp — coherente con urlDe (ADR-008: las variantes se optimizan a webp).
      expect(input.Key).toBe("propiedades/p-1/foto-2/original.webp");
    });
  });

  describe("eliminarPrefijos", () => {
    it("es no-op con array vacío — no llama a send", async () => {
      const adapter = build();
      await adapter.eliminarPrefijos([]);
      expect(send).not.toHaveBeenCalled();
    });

    it("lista y borra los objetos de cada prefijo", async () => {
      send.mockImplementation((command: { __type: string }) => {
        if (command.__type === "ListObjectsV2Command") {
          return Promise.resolve({
            Contents: [
              { Key: "propiedades/p-1/foto-1/original.webp" },
              { Key: "propiedades/p-1/foto-1/card.webp" },
            ],
          });
        }
        return Promise.resolve({});
      });
      const adapter = build();

      await adapter.eliminarPrefijos(["propiedades/p-1/foto-1"]);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "arrendadora-multimedia-dev",
          Prefix: "propiedades/p-1/foto-1/",
        }),
      );
      expect(DeleteObjectsCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "arrendadora-multimedia-dev",
          Delete: {
            Objects: [
              { Key: "propiedades/p-1/foto-1/original.webp" },
              { Key: "propiedades/p-1/foto-1/card.webp" },
            ],
          },
        }),
      );
    });

    it("no borra si el prefijo no tiene objetos (idempotente)", async () => {
      send.mockImplementation((command: { __type: string }) => {
        if (command.__type === "ListObjectsV2Command") {
          return Promise.resolve({ Contents: [] });
        }
        return Promise.resolve({});
      });
      const adapter = build();

      await adapter.eliminarPrefijos(["propiedades/p-1/foto-inexistente"]);

      expect(DeleteObjectsCommand).not.toHaveBeenCalled();
    });
  });

  describe("urlDe", () => {
    it("arma la URL path-style esperada contra el endpoint de LocalStack", () => {
      const adapter = build();
      const url = adapter.urlDe("propiedades/p-1/foto-1", "card");
      expect(url).toBe(
        "http://localhost:4566/arrendadora-multimedia-dev/propiedades/p-1/foto-1/card.webp",
      );
    });

    it("no deja doble slash si el endpoint viene con slash final", () => {
      const adapter = build({ s3Endpoint: "http://localhost:4566/" });
      const url = adapter.urlDe("propiedades/p-1/foto-1", "thumbnail");
      expect(url).toBe(
        "http://localhost:4566/arrendadora-multimedia-dev/propiedades/p-1/foto-1/thumbnail.webp",
      );
    });
  });
});
