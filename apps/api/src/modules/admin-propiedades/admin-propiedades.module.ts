import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthUsuariosModule } from "../auth-usuarios/auth-usuarios.module";
import { AdminMultimediaModule } from "../admin-multimedia/admin-multimedia.module";
import type { GeocodingConfig } from "../../config/configuration";

import { PROPIEDAD_REPOSITORY } from "./domain/ports/propiedad.repository.port";
import {
  AMENIDAD_REPOSITORY,
  TIPO_PROPIEDAD_REPOSITORY,
  type CatalogoRepositoryPort,
} from "./domain/ports/catalogo.repository.port";
import { HISTORIAL_ESTADO_REPOSITORY } from "./domain/ports/historial-estado.repository.port";
import { GENERADOR_CODIGO } from "./domain/ports/generador-codigo.port";
import { ID_GENERATOR, type IdGeneratorPort } from "./domain/ports/id-generator.port";
import { RELOJ, type RelojPort } from "./domain/ports/reloj.port";
import { GEOCODING } from "./domain/ports/geocoding.port";
import { ETIQUETAS_AMENIDAD, ETIQUETAS_TIPO_PROPIEDAD } from "./domain/types/catalogo-etiquetas";

import { PropiedadPrismaRepository } from "./infrastructure/persistence/propiedad-prisma.repository";
import { TipoPropiedadPrismaRepository } from "./infrastructure/persistence/tipo-propiedad-prisma.repository";
import { AmenidadPrismaRepository } from "./infrastructure/persistence/amenidad-prisma.repository";
import { HistorialEstadoPrismaRepository } from "./infrastructure/persistence/historial-estado-prisma.repository";
import { CodigoSecuencialPrismaAdapter } from "./infrastructure/support/codigo-secuencial-prisma.adapter";
import { CryptoIdGeneratorAdapter } from "./infrastructure/support/crypto-id-generator.adapter";
import { RelojSistemaAdapter } from "./infrastructure/support/reloj-sistema.adapter";
import { GoogleGeocodingAdapter } from "./infrastructure/geocoding/google-geocoding.adapter";
import { StubGeocodingAdapter } from "./infrastructure/geocoding/stub-geocoding.adapter";

import { CrearPropiedadUseCase } from "./application/use-cases/crear-propiedad.use-case";
import { EditarPropiedadUseCase } from "./application/use-cases/editar-propiedad.use-case";
import { ListarPropiedadesUseCase } from "./application/use-cases/listar-propiedades.use-case";
import { ObtenerPropiedadUseCase } from "./application/use-cases/obtener-propiedad.use-case";
import { CambiarEstadoPropiedadUseCase } from "./application/use-cases/cambiar-estado-propiedad.use-case";
import { DuplicarPropiedadUseCase } from "./application/use-cases/duplicar-propiedad.use-case";
import { ArchivarPropiedadUseCase } from "./application/use-cases/archivar-propiedad.use-case";
import { RestaurarPropiedadUseCase } from "./application/use-cases/restaurar-propiedad.use-case";
import { ListarHistorialUseCase } from "./application/use-cases/listar-historial.use-case";
import { EstablecerUbicacionPropiedadUseCase } from "./application/use-cases/establecer-ubicacion-propiedad.use-case";
import { CrearCatalogoUseCase } from "./application/use-cases/crear-catalogo.use-case";
import { EditarCatalogoUseCase } from "./application/use-cases/editar-catalogo.use-case";
import { ListarCatalogoUseCase } from "./application/use-cases/listar-catalogo.use-case";
import { DesactivarCatalogoUseCase } from "./application/use-cases/desactivar-catalogo.use-case";

import { PropiedadesController } from "./infrastructure/http/propiedades.controller";
import {
  AmenidadesController,
  CREAR_AMENIDAD_UC,
  CREAR_TIPO_PROPIEDAD_UC,
  DESACTIVAR_AMENIDAD_UC,
  DESACTIVAR_TIPO_PROPIEDAD_UC,
  EDITAR_AMENIDAD_UC,
  EDITAR_TIPO_PROPIEDAD_UC,
  LISTAR_AMENIDAD_UC,
  LISTAR_TIPO_PROPIEDAD_UC,
  TiposPropiedadController,
} from "./infrastructure/http/catalogo.controller";

/**
 * 3. Panel Admin — Propiedades (ANALYZE-003). Dueño de escritura del aggregate raíz `Propiedad`:
 * CRUD, máquina de estados (RN-012), catálogos administrables (tipos/amenidades, ADR-005) e
 * historial de cambios de estado (ADR-006). Importa `AuthUsuariosModule` (upstream Customer/Supplier,
 * DESIGN-027) para reutilizar `SessionAuthGuard`/`RolesGuard` sin duplicar la cadena de auth.
 *
 * Endpoints (DESIGN-028): `/admin/propiedades*`, `/admin/tipos-propiedad*`, `/admin/amenidades*`.
 * El endpoint `/admin/configuracion` (singleton ConfiguracionSistema, ADR-012) NO se implementa
 * aquí — su bounded context es ambiguo (ver CLAUDE.md del módulo, ESCALAMIENTO a solution-architect).
 */
@Module({
  // `AdminMultimediaModule` exporta `MULTIMEDIA_QUERY` (lectura in-process, DESIGN-027) para que
  // `obtener-propiedad` cierre el `fotos[]` del contrato. Sin ciclo de módulos: admin-multimedia
  // solo importa `AuthUsuariosModule` (lee la tabla `propiedades` vía Prisma, no importa este BC).
  imports: [AuthUsuariosModule, AdminMultimediaModule],
  controllers: [PropiedadesController, TiposPropiedadController, AmenidadesController],
  providers: [
    // Puertos → adaptadores de infraestructura
    { provide: PROPIEDAD_REPOSITORY, useClass: PropiedadPrismaRepository },
    { provide: TIPO_PROPIEDAD_REPOSITORY, useClass: TipoPropiedadPrismaRepository },
    { provide: AMENIDAD_REPOSITORY, useClass: AmenidadPrismaRepository },
    { provide: HISTORIAL_ESTADO_REPOSITORY, useClass: HistorialEstadoPrismaRepository },
    { provide: GENERADOR_CODIGO, useClass: CodigoSecuencialPrismaAdapter },
    { provide: ID_GENERATOR, useClass: CryptoIdGeneratorAdapter },
    { provide: RELOJ, useClass: RelojSistemaAdapter },

    // Puerto de geocoding → adaptador seleccionado por config (Google en prod, stub en dev/tests).
    // Mismo patrón que el anti-bot de `portal-detalle` (env GEOCODING_DRIVER, ADR-011).
    {
      provide: GEOCODING,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const geocoding = config.get<GeocodingConfig>("geocoding");
        return geocoding?.driver === "google" && geocoding.apiKey
          ? new GoogleGeocodingAdapter(config)
          : new StubGeocodingAdapter();
      },
    },

    // Casos de uso de propiedad (aplicación) — inyectables estándar
    CrearPropiedadUseCase,
    EditarPropiedadUseCase,
    ListarPropiedadesUseCase,
    ObtenerPropiedadUseCase,
    CambiarEstadoPropiedadUseCase,
    DuplicarPropiedadUseCase,
    ArchivarPropiedadUseCase,
    RestaurarPropiedadUseCase,
    ListarHistorialUseCase,
    EstablecerUbicacionPropiedadUseCase,

    // Casos de uso genéricos de catálogo — una instancia por catálogo vía factory provider (ADR-005).
    // Cada instancia queda ligada a su repositorio y a sus etiquetas de mensajes en español.
    {
      provide: LISTAR_TIPO_PROPIEDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort) => new ListarCatalogoUseCase(repo),
      inject: [TIPO_PROPIEDAD_REPOSITORY],
    },
    {
      provide: CREAR_TIPO_PROPIEDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, id: IdGeneratorPort, reloj: RelojPort) =>
        new CrearCatalogoUseCase(repo, id, reloj, ETIQUETAS_TIPO_PROPIEDAD),
      inject: [TIPO_PROPIEDAD_REPOSITORY, ID_GENERATOR, RELOJ],
    },
    {
      provide: EDITAR_TIPO_PROPIEDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, reloj: RelojPort) =>
        new EditarCatalogoUseCase(repo, reloj, ETIQUETAS_TIPO_PROPIEDAD),
      inject: [TIPO_PROPIEDAD_REPOSITORY, RELOJ],
    },
    {
      provide: DESACTIVAR_TIPO_PROPIEDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, reloj: RelojPort) =>
        new DesactivarCatalogoUseCase(repo, reloj, ETIQUETAS_TIPO_PROPIEDAD),
      inject: [TIPO_PROPIEDAD_REPOSITORY, RELOJ],
    },
    {
      provide: LISTAR_AMENIDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort) => new ListarCatalogoUseCase(repo),
      inject: [AMENIDAD_REPOSITORY],
    },
    {
      provide: CREAR_AMENIDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, id: IdGeneratorPort, reloj: RelojPort) =>
        new CrearCatalogoUseCase(repo, id, reloj, ETIQUETAS_AMENIDAD),
      inject: [AMENIDAD_REPOSITORY, ID_GENERATOR, RELOJ],
    },
    {
      provide: EDITAR_AMENIDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, reloj: RelojPort) =>
        new EditarCatalogoUseCase(repo, reloj, ETIQUETAS_AMENIDAD),
      inject: [AMENIDAD_REPOSITORY, RELOJ],
    },
    {
      provide: DESACTIVAR_AMENIDAD_UC,
      useFactory: (repo: CatalogoRepositoryPort, reloj: RelojPort) =>
        new DesactivarCatalogoUseCase(repo, reloj, ETIQUETAS_AMENIDAD),
      inject: [AMENIDAD_REPOSITORY, RELOJ],
    },
  ],
})
export class AdminPropiedadesModule {}
