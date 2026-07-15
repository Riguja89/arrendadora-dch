/** Configuración por variables de entorno — cargada vía @nestjs/config (ADR-002). */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
});
