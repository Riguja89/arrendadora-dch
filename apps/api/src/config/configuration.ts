/**
 * Configuración del almacenamiento de multimedia (ADR-008). `driver` selecciona el adaptador del
 * `AlmacenamientoObjetosPort`: `local` (dev/tests, sin proveedor real) o `s3` (producción). Las
 * credenciales AWS NUNCA se hardcodean — vienen por env / IAM role (secrets-scan).
 */
export interface MultimediaConfig {
  storageDriver: "local" | "s3";
  /** Base pública (CloudFront/CDN o mock local) desde donde se sirven las variantes de imagen. */
  cdnBaseUrl: string;
  s3Bucket: string;
  s3Region: string;
}

/** Configuración por variables de entorno — cargada vía @nestjs/config (ADR-002). */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  /** Base del panel administrativo — usada para construir el enlace de recuperación (RN-019). */
  panelUrl: string;
  multimedia: MultimediaConfig;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  panelUrl: process.env.PANEL_URL ?? "http://localhost:5173",
  multimedia: {
    storageDriver: process.env.MULTIMEDIA_STORAGE_DRIVER === "s3" ? "s3" : "local",
    cdnBaseUrl: process.env.MULTIMEDIA_CDN_BASE_URL ?? "http://localhost:3000/media",
    s3Bucket: process.env.AWS_S3_BUCKET ?? "",
    s3Region: process.env.AWS_REGION ?? "",
  },
});
