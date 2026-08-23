import { afterEach, beforeEach, describe, expect, it } from "vitest";
import configuration from "./configuration";

/**
 * Robustez de `configuration.ts` para las env vars de multimedia S3 (ADR-008): una env var
 * PRESENTE pero VACÍA (`AWS_S3_BUCKET=""`) debe caer al mismo default de dev que una env var
 * AUSENTE. Antes del fix usaba `??`, que solo cae al default con `undefined` — con `""` producía
 * `s3Bucket: ""` y una URL de foto con doble slash y sin bucket
 * (`http://localhost:4566//propiedades/...`).
 */
describe("configuration — robustez de env vars S3 (multimedia)", () => {
  const ENV_KEYS = [
    "AWS_S3_BUCKET",
    "AWS_REGION",
    "AWS_S3_ENDPOINT",
    "AWS_S3_FORCE_PATH_STYLE",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "MULTIMEDIA_STORAGE_DRIVER",
  ] as const;

  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const valor = originalEnv[key];
      if (valor === undefined) delete process.env[key];
      else process.env[key] = valor;
    }
  });

  it("var ausente → cae al default de dev (comportamiento previo, sin regresión)", () => {
    const config = configuration();
    expect(config.multimedia.s3Bucket).toBe("arrendadora-multimedia-dev");
    expect(config.multimedia.s3Endpoint).toBe("http://localhost:4566");
    expect(config.multimedia.s3Region).toBe("us-east-1");
    expect(config.multimedia.s3AccessKeyId).toBe("test");
    expect(config.multimedia.s3SecretAccessKey).toBe("test");
  });

  it("AWS_S3_BUCKET vacío (\"\") → cae al default, NO produce URL con doble slash", () => {
    process.env.AWS_S3_BUCKET = "";
    const config = configuration();
    expect(config.multimedia.s3Bucket).toBe("arrendadora-multimedia-dev");

    // Verificación de regresión explícita: la URL que arma el S3AlmacenamientoAdapter
    // (`${endpoint}/${bucket}/...`) no debe tener doble slash sin bucket.
    const url = `${config.multimedia.s3Endpoint}/${config.multimedia.s3Bucket}/propiedades/p-1/foto-1/card.webp`;
    expect(url).not.toContain("//propiedades");
    expect(url).toBe(
      "http://localhost:4566/arrendadora-multimedia-dev/propiedades/p-1/foto-1/card.webp",
    );
  });

  it("AWS_S3_ENDPOINT vacío o solo espacios → cae al default de LocalStack", () => {
    process.env.AWS_S3_ENDPOINT = "   ";
    const config = configuration();
    expect(config.multimedia.s3Endpoint).toBe("http://localhost:4566");
  });

  it("AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY vacíos → caen a sus defaults", () => {
    process.env.AWS_REGION = "";
    process.env.AWS_ACCESS_KEY_ID = "";
    process.env.AWS_SECRET_ACCESS_KEY = "";
    const config = configuration();
    expect(config.multimedia.s3Region).toBe("us-east-1");
    expect(config.multimedia.s3AccessKeyId).toBe("test");
    expect(config.multimedia.s3SecretAccessKey).toBe("test");
  });

  it("var con valor real (no vacío) → se respeta, no se pisa con el default", () => {
    process.env.AWS_S3_BUCKET = "bucket-prod";
    process.env.AWS_S3_ENDPOINT = "https://s3.us-east-1.amazonaws.com";
    const config = configuration();
    expect(config.multimedia.s3Bucket).toBe("bucket-prod");
    expect(config.multimedia.s3Endpoint).toBe("https://s3.us-east-1.amazonaws.com");
  });

  it("storageDriver NO usa envOrDefault — vacío sigue siendo 'local', no se confunde con 's3'", () => {
    process.env.MULTIMEDIA_STORAGE_DRIVER = "";
    const config = configuration();
    expect(config.multimedia.storageDriver).toBe("local");
  });
});
