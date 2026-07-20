-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('administrador', 'agente', 'editor');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('activo', 'desactivado', 'bloqueado');

-- CreateEnum
CREATE TYPE "TipoOperacion" AS ENUM ('arriendo', 'venta');

-- CreateEnum
CREATE TYPE "EstadoPropiedad" AS ENUM ('disponible', 'reservada', 'arrendada_vendida');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'activo',
    "whatsapp" TEXT,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "requiere_cambio_password" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "ip" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_propiedad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tipos_propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenidades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amenidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propiedades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_operacion" "TipoOperacion" NOT NULL,
    "tipo_propiedad_id" UUID NOT NULL,
    "ciudad" TEXT NOT NULL,
    "barrio" TEXT,
    "direccion" TEXT,
    "precio" BIGINT NOT NULL,
    "area" INTEGER NOT NULL,
    "habitaciones" INTEGER NOT NULL,
    "banos" INTEGER NOT NULL,
    "estrato" SMALLINT,
    "parqueaderos" INTEGER,
    "estado" "EstadoPropiedad" NOT NULL DEFAULT 'disponible',
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "agente_id" UUID,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "publicada_en" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "propiedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propiedad_amenidad" (
    "propiedad_id" UUID NOT NULL,
    "amenidad_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "propiedad_amenidad_pkey" PRIMARY KEY ("propiedad_id","amenidad_id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propiedad_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_portada" BOOLEAN NOT NULL DEFAULT false,
    "s3_key_base" TEXT NOT NULL,
    "formato_original" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estado_propiedad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propiedad_id" UUID NOT NULL,
    "estado_anterior" TEXT NOT NULL,
    "estado_nuevo" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cambiado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,

    CONSTRAINT "historial_estado_propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "whatsapp_numero_central" TEXT NOT NULL,
    "whatsapp_plantilla_mensaje" TEXT NOT NULL,
    "nombre_inmobiliaria" TEXT NOT NULL,
    "imagen_generica_url" TEXT NOT NULL,
    "actualizada_por" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_expira_en_idx" ON "sesiones"("expira_en");

-- CreateIndex
CREATE INDEX "password_reset_tokens_usuario_id_idx" ON "password_reset_tokens"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_propiedad_nombre_key" ON "tipos_propiedad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "amenidades_nombre_key" ON "amenidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "propiedades_codigo_key" ON "propiedades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "propiedades_slug_key" ON "propiedades"("slug");

-- CreateIndex
CREATE INDEX "propiedades_estado_archivada_publicada_en_idx" ON "propiedades"("estado", "archivada", "publicada_en" DESC);

-- CreateIndex
CREATE INDEX "propiedades_tipo_operacion_tipo_propiedad_id_ciudad_idx" ON "propiedades"("tipo_operacion", "tipo_propiedad_id", "ciudad");

-- CreateIndex
CREATE INDEX "propiedades_agente_id_idx" ON "propiedades"("agente_id");

-- CreateIndex
CREATE INDEX "fotos_propiedad_id_idx" ON "fotos"("propiedad_id");

-- CreateIndex
CREATE INDEX "historial_estado_propiedad_propiedad_id_cambiado_en_idx" ON "historial_estado_propiedad"("propiedad_id", "cambiado_en" DESC);

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_tipo_propiedad_id_fkey" FOREIGN KEY ("tipo_propiedad_id") REFERENCES "tipos_propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_agente_id_fkey" FOREIGN KEY ("agente_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propiedad_amenidad" ADD CONSTRAINT "propiedad_amenidad_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propiedad_amenidad" ADD CONSTRAINT "propiedad_amenidad_amenidad_id_fkey" FOREIGN KEY ("amenidad_id") REFERENCES "amenidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_propiedad" ADD CONSTRAINT "historial_estado_propiedad_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_propiedad" ADD CONSTRAINT "historial_estado_propiedad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_sistema" ADD CONSTRAINT "configuracion_sistema_actualizada_por_fkey" FOREIGN KEY ("actualizada_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
