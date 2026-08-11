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
  /**
   * Endpoint del proveedor S3-compatible (ADR-008). En producción normalmente vacío (AWS SDK
   * resuelve el endpoint estándar por región); en dev apunta a LocalStack (`http://localhost:4566`).
   */
  s3Endpoint: string;
  /** `true` para endpoints S3-compatibles (LocalStack, MinIO) que requieren path-style en vez de virtual-hosted-style. */
  s3ForcePathStyle: boolean;
  /** Credenciales AWS — NUNCA hardcodeadas; en producción vienen por IAM role/env, en dev por LocalStack (secrets-scan). */
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
}

/**
 * Configuración del anti-bot del contacto por WhatsApp (ADR-007). `driver` selecciona el adaptador
 * del `VerificadorAntibotPort`: `stub` (dev/tests, sin credenciales — aprueba siempre) o `recaptcha`
 * (producción, verifica el token contra la API de Google). La **clave secreta** NUNCA se hardcodea —
 * viene por env (secrets-scan). El umbral de score es configurable (ADR-007, p. ej. ≥ 0.5).
 */
export interface AntibotConfig {
  driver: "recaptcha" | "stub";
  /** Clave secreta de reCAPTCHA v3 (solo backend, nunca en el frontend ni en el repo). */
  recaptchaSecret: string;
  /** Score mínimo para aprobar (0..1). Por debajo → rechazo (403). */
  scoreMinimo: number;
  /** Endpoint `siteverify` de Google (configurable para tests/mocks). */
  verifyUrl: string;
}

/**
 * Configuración de geocodificación de direcciones (ADR-011, RN-033). `driver` selecciona el
 * adaptador del `GeocodingPort`: `stub` (dev/tests, sin credenciales — coordenadas
 * determinísticas) o `google` (producción, Google Geocoding API). La **API key** NUNCA se
 * hardcodea — viene por env (secrets-scan), restringida por IP (ADR-011).
 */
export interface GeocodingConfig {
  driver: "google" | "stub";
  /** API key de Google Geocoding (solo backend, restringida por IP — nunca en el repo). */
  apiKey: string;
  /** Endpoint de Geocoding API (configurable para tests/mocks). */
  geocodeUrl: string;
}

/**
 * Lee una env var tratando el string vacío (`""`) como ausente — a diferencia de `??`, que solo
 * cae al default con `undefined`. Un `.env` con `AWS_S3_BUCKET=` (vacío, sin valor) produce hoy
 * `""` en `process.env`, no `undefined`; sin este helper, `s3Bucket` queda `""` y la URL resultante
 * tiene doble slash sin bucket (`http://localhost:4566//propiedades/...`). Aplica solo a valores con
 * default de dev (bucket/endpoint/región/credenciales S3) — NUNCA a `storageDriver`, que sí debe
 * distinguir explícitamente `"s3"` de cualquier otro valor (incluido vacío) para no activar S3 por
 * accidente.
 */
function envOrDefault(valor: string | undefined, porDefecto: string): string {
  const normalizado = valor?.trim();
  return normalizado ? normalizado : porDefecto;
}

/** Configuración por variables de entorno — cargada vía @nestjs/config (ADR-002). */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  /** Base del panel administrativo — usada para construir el enlace de recuperación (RN-019). */
  panelUrl: string;
  /** Base del SPA del portal público — usada para el `og:url` canónico de la ficha (ADR-010). */
  portalUrl: string;
  multimedia: MultimediaConfig;
  antibot: AntibotConfig;
  geocoding: GeocodingConfig;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  panelUrl: process.env.PANEL_URL ?? "http://localhost:5173",
  portalUrl: process.env.PORTAL_URL ?? "http://localhost:5174",
  multimedia: {
    storageDriver: process.env.MULTIMEDIA_STORAGE_DRIVER === "s3" ? "s3" : "local",
    cdnBaseUrl: process.env.MULTIMEDIA_CDN_BASE_URL ?? "http://localhost:3000/media",
    // Defaults de DEV apuntando a LocalStack (bucket ya provisionado, ver ADR-008). En
    // producción se sobreescriben por env — nunca se hardcodean credenciales reales.
    // `envOrDefault` (no `??`): una env var presente pero vacía ("") debe caer al default igual
    // que si estuviera ausente — evita URLs con doble slash sin bucket.
    s3Bucket: envOrDefault(process.env.AWS_S3_BUCKET, "arrendadora-multimedia-dev"),
    s3Region: envOrDefault(process.env.AWS_REGION, "us-east-1"),
    s3Endpoint: envOrDefault(process.env.AWS_S3_ENDPOINT, "http://localhost:4566"),
    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE !== "false",
    s3AccessKeyId: envOrDefault(process.env.AWS_ACCESS_KEY_ID, "test"),
    s3SecretAccessKey: envOrDefault(process.env.AWS_SECRET_ACCESS_KEY, "test"),
  },
  antibot: {
    driver: process.env.ANTIBOT_DRIVER === "recaptcha" ? "recaptcha" : "stub",
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY ?? "",
    scoreMinimo: parseFloat(process.env.RECAPTCHA_SCORE_MIN ?? "0.5"),
    verifyUrl:
      process.env.RECAPTCHA_VERIFY_URL ?? "https://www.google.com/recaptcha/api/siteverify",
  },
  geocoding: {
    driver: process.env.GEOCODING_DRIVER === "google" ? "google" : "stub",
    apiKey: process.env.GOOGLE_GEOCODING_API_KEY ?? "",
    geocodeUrl: process.env.GEOCODING_URL ?? "https://maps.googleapis.com/maps/api/geocode/json",
  },
});
