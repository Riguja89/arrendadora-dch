import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthUsuariosModule } from "../auth-usuarios/auth-usuarios.module";
import type { MultimediaConfig } from "../../config/configuration";

import { FOTO_REPOSITORY } from "./domain/ports/foto.repository.port";
import { ALMACENAMIENTO_OBJETOS } from "./domain/ports/almacenamiento-objetos.port";
import { OPTIMIZADOR_IMAGENES } from "./domain/ports/optimizador-imagenes.port";
import { PROPIEDAD_ACCESO } from "./domain/ports/propiedad-acceso.port";
import { ID_GENERATOR } from "./domain/ports/id-generator.port";
import { RELOJ } from "./domain/ports/reloj.port";
import { MULTIMEDIA_QUERY } from "./domain/ports/multimedia-query.port";

import { FotoPrismaRepository } from "./infrastructure/persistence/foto-prisma.repository";
import { LocalAlmacenamientoAdapter } from "./infrastructure/storage/local-almacenamiento.adapter";
import { S3AlmacenamientoAdapter } from "./infrastructure/storage/s3-almacenamiento.adapter";
import { PassthroughOptimizadorAdapter } from "./infrastructure/imagen/passthrough-optimizador.adapter";
import { PropiedadAccesoPrismaAdapter } from "./infrastructure/acceso/propiedad-acceso-prisma.adapter";
import { CryptoIdGeneratorAdapter } from "./infrastructure/support/crypto-id-generator.adapter";
import { RelojSistemaAdapter } from "./infrastructure/support/reloj-sistema.adapter";
import { MultimediaQueryAdapter } from "./infrastructure/query/multimedia-query.adapter";

import { CargarFotosUseCase } from "./application/use-cases/cargar-fotos.use-case";
import { ListarFotosUseCase } from "./application/use-cases/listar-fotos.use-case";
import { ReordenarFotosUseCase } from "./application/use-cases/reordenar-fotos.use-case";
import { DefinirPortadaUseCase } from "./application/use-cases/definir-portada.use-case";
import { EliminarFotoUseCase } from "./application/use-cases/eliminar-foto.use-case";

import { MultimediaController } from "./infrastructure/http/multimedia.controller";
import type { AlmacenamientoObjetosPort } from "./domain/ports/almacenamiento-objetos.port";

/**
 * Factory de selección del adaptador de almacenamiento (ADR-008), extraída para poder testearse sin
 * levantar el módulo completo de Nest. `MULTIMEDIA_STORAGE_DRIVER=s3` → `S3AlmacenamientoAdapter`;
 * cualquier otro valor (default) → `LocalAlmacenamientoAdapter` (retrocompatible).
 */
export function crearAlmacenamientoAdapter(config: ConfigService): AlmacenamientoObjetosPort {
  const multimedia = config.get<MultimediaConfig>("multimedia");
  return multimedia?.storageDriver === "s3"
    ? new S3AlmacenamientoAdapter(config)
    : new LocalAlmacenamientoAdapter(config);
}

/**
 * 4. Panel Admin — Multimedia (ANALYZE-004). Galería de fotos como composición del aggregate
 * `Propiedad` (DESIGN-027). Binarios en S3/CloudFront (ADR-008); la BD solo persiste metadatos y
 * claves de almacenamiento. Importa `AuthUsuariosModule` (upstream Customer/Supplier) para reutilizar
 * `SessionAuthGuard`/`RolesGuard` sin duplicar la cadena de auth.
 *
 * Endpoints (DESIGN-028): `/admin/propiedades/{id}/fotos*` (carga múltiple, listado, reorden, portada,
 * eliminación). La geolocalización (`/ubicacion`, ADR-011) NO se implementa aquí — muta la Propiedad,
 * no la multimedia binaria (ver CLAUDE.md).
 *
 * Exporta `MULTIMEDIA_QUERY` (`MultimediaQueryPort`): puerto de solo lectura para que
 * admin-propiedades cierre su `fotos[]` y el portal arme la galería/og:image (RN-014) in-process.
 *
 * Selección de almacenamiento (ADR-008): por env `MULTIMEDIA_STORAGE_DRIVER`. `s3` → adaptador S3
 * (producción y dev sobre LocalStack); cualquier otro valor (default) → `LocalAlmacenamientoAdapter`
 * (dev/tests sin proveedor real, retrocompatible). Mismo patrón que `VERIFICADOR_ANTIBOT` en
 * `portal-detalle.module.ts` y que la optimización (passthrough dev vs Sharp producción).
 */
@Module({
  imports: [AuthUsuariosModule],
  controllers: [MultimediaController],
  providers: [
    // Puertos → adaptadores de infraestructura
    { provide: FOTO_REPOSITORY, useClass: FotoPrismaRepository },
    {
      provide: ALMACENAMIENTO_OBJETOS,
      inject: [ConfigService],
      useFactory: crearAlmacenamientoAdapter,
    },
    { provide: OPTIMIZADOR_IMAGENES, useClass: PassthroughOptimizadorAdapter },
    { provide: PROPIEDAD_ACCESO, useClass: PropiedadAccesoPrismaAdapter },
    { provide: ID_GENERATOR, useClass: CryptoIdGeneratorAdapter },
    { provide: RELOJ, useClass: RelojSistemaAdapter },
    { provide: MULTIMEDIA_QUERY, useClass: MultimediaQueryAdapter },

    // Casos de uso (aplicación)
    CargarFotosUseCase,
    ListarFotosUseCase,
    ReordenarFotosUseCase,
    DefinirPortadaUseCase,
    EliminarFotoUseCase,
  ],
  // Solo se expone el puerto de consulta de solo lectura — nunca el repositorio ni el aggregate.
  exports: [MULTIMEDIA_QUERY],
})
export class AdminMultimediaModule {}
