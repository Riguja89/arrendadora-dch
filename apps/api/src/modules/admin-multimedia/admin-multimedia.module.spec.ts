import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { crearAlmacenamientoAdapter } from "./admin-multimedia.module";
import { LocalAlmacenamientoAdapter } from "./infrastructure/storage/local-almacenamiento.adapter";
import { S3AlmacenamientoAdapter } from "./infrastructure/storage/s3-almacenamiento.adapter";

function buildConfigService(storageDriver: "local" | "s3"): ConfigService {
  return {
    get: vi.fn().mockReturnValue({
      storageDriver,
      cdnBaseUrl: "http://localhost:3000/media",
      s3Bucket: "arrendadora-multimedia-dev",
      s3Region: "us-east-1",
      s3Endpoint: "http://localhost:4566",
      s3ForcePathStyle: true,
      s3AccessKeyId: "test",
      s3SecretAccessKey: "test",
    }),
  } as unknown as ConfigService;
}

describe("crearAlmacenamientoAdapter", () => {
  it("resuelve S3AlmacenamientoAdapter cuando MULTIMEDIA_STORAGE_DRIVER=s3", () => {
    const adapter = crearAlmacenamientoAdapter(buildConfigService("s3"));
    expect(adapter).toBeInstanceOf(S3AlmacenamientoAdapter);
  });

  it("resuelve LocalAlmacenamientoAdapter por default (retrocompatible)", () => {
    const adapter = crearAlmacenamientoAdapter(buildConfigService("local"));
    expect(adapter).toBeInstanceOf(LocalAlmacenamientoAdapter);
  });
});
