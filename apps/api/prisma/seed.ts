/**
 * Seed de datos mockeados para desarrollo local (Arrendadora API).
 *
 * Genera vía UPSERT (idempotente — re-ejecutable en cualquier reset):
 *   - Usuarios (1 por rol: administrador, agente, editor)
 *   - Catálogos: TipoPropiedad, Amenidad
 *   - ConfiguracionSistema (fila única/singleton)
 *   - ~24 Propiedades variadas (ciudades, tipo de operación, estado, destacada/archivada)
 *   - 1 Foto de portada por propiedad (subida real a S3/LocalStack — resuelve el follow-up
 *     PORTAL-GENERICA-01: las tarjetas ya no caen al genérico roto)
 *   - PropiedadAmenidad (relación N:N con cantidad)
 *   - HistorialEstadoPropiedad (1 entrada de auditoría por propiedad recién creada)
 *
 * No pasa por Nest DI — usa @prisma/client directo, como es convención para scripts de seed.
 *
 * IMPORTANTE — decisiones documentadas:
 *   - Hashing: bcryptjs con coste 12 (ADR-004 "bcrypt con coste ≥12" — Argon2id es la opción
 *     preferida del ADR pero requiere el adapter de dominio de auth, que aún no expone un caso
 *     de uso de login; cuando se implemente, debe usarse el MISMO algoritmo que aquí).
 *   - Fotos: el adapter real `s3-almacenamiento.adapter.ts` (ADR-008, ya implementado en esta
 *     rama) construye SIEMPRE `{s3KeyBase}/{variante}.webp` en `urlDe()` — extensión fija, no
 *     lee `formatoOriginal`. No hay pipeline Sharp disponible en este seed para generar bytes
 *     WEBP reales, así que se sube el mismo PNG placeholder de 1x1 pero con la key nombrada
 *     `.webp` (bytes reales = PNG, extension/Content-Type declarados = webp) para que la URL
 *     que construye el adapter real resuelva 200. Limitación conocida y documentada: un
 *     decodificador estricto de imagen podría rechazar el archivo por firma de bytes
 *     inconsistente con la extensión; para el propósito de datos mock/local esto es aceptable.
 *     `formatoOriginal` guarda "webp" para reflejar la key subida (no el contenido real).
 *
 * Credenciales de prueba (SOLO dev local, nunca datos reales):
 *   administrador → SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (.env)
 *   agente        → agente.demo@arrendadora.local / Agente2026
 *   editor        → editor.demo@arrendadora.local / Editor2026
 */

import { randomUUID } from "node:crypto";
import { PrismaClient, type EstadoPropiedad, type TipoOperacion } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_S3_ENDPOINT ?? "http://localhost:4566",
  forcePathStyle: (process.env.AWS_S3_FORCE_PATH_STYLE ?? "true") === "true",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET ?? "arrendadora-multimedia-dev";
const HASH_COST = 12;

// PNG 1x1 transparente — placeholder mínimo válido, sin depender de internet.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`  [s3] bucket creado: ${BUCKET}`);
  }
}

async function uploadPlaceholder(key: string): Promise<void> {
  // Los bytes reales siempre son el PNG placeholder de 1x1 (no hay pipeline Sharp en este seed
  // para generar WEBP real) — pero el Content-Type declarado sigue la extension de la key para
  // no mentir en el header aunque la key este nombrada .webp por convencion del adapter real.
  const contentType = key.endsWith(".webp") ? "image/webp" : "image/png";
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: PLACEHOLDER_PNG,
      ContentType: contentType,
    }),
  );
}

// ---------------------------------------------------------------------------
// 1. Usuarios
// ---------------------------------------------------------------------------

async function seedUsuarios() {
  const usuariosSeed = [
    {
      nombre: "Administrador Arrendadora",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@arrendadora.local",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Cambiar123",
      rol: "administrador" as const,
    },
    {
      nombre: "Agente Comercial Demo",
      email: "agente.demo@arrendadora.local",
      password: "Agente2026",
      rol: "agente" as const,
    },
    {
      nombre: "Editor de Catalogo Demo",
      email: "editor.demo@arrendadora.local",
      password: "Editor2026",
      rol: "editor" as const,
    },
  ];

  const usuariosPorRol: Record<string, { id: string }> = {};

  for (const u of usuariosSeed) {
    const passwordHash = bcrypt.hashSync(u.password, HASH_COST);
    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      create: {
        nombre: u.nombre,
        email: u.email,
        passwordHash,
        rol: u.rol,
        estado: "activo",
      },
      update: {
        nombre: u.nombre,
        passwordHash,
        rol: u.rol,
        estado: "activo",
        intentosFallidos: 0,
      },
    });
    usuariosPorRol[u.rol] = { id: usuario.id };
    console.log(`  [usuarios] ${u.rol.padEnd(14)} -> ${u.email}`);
  }

  return usuariosPorRol;
}

// ---------------------------------------------------------------------------
// 2. Catalogos
// ---------------------------------------------------------------------------

const TIPOS_PROPIEDAD = [
  { nombre: "Apartamento", prefijo: "AP" },
  { nombre: "Casa", prefijo: "CA" },
  { nombre: "Oficina", prefijo: "OF" },
  { nombre: "Local Comercial", prefijo: "LC" },
  { nombre: "Lote", prefijo: "LT" },
];

const AMENIDADES = [
  "Piscina",
  "Gimnasio",
  "Parqueadero",
  "Ascensor",
  "Terraza",
  "Zona BBQ",
  "Vigilancia 24 horas",
];

async function seedTiposPropiedad() {
  const resultado: Record<string, { id: string; prefijo: string }> = {};
  for (const [i, t] of TIPOS_PROPIEDAD.entries()) {
    const row = await prisma.tipoPropiedad.upsert({
      where: { nombre: t.nombre },
      create: { nombre: t.nombre, activo: true, orden: i + 1 },
      update: { activo: true, orden: i + 1 },
    });
    resultado[t.nombre] = { id: row.id, prefijo: t.prefijo };
  }
  console.log(`  [tipos_propiedad] ${TIPOS_PROPIEDAD.length} catalogados`);
  return resultado;
}

async function seedAmenidades() {
  const resultado: Record<string, { id: string }> = {};
  for (const [i, nombre] of AMENIDADES.entries()) {
    const row = await prisma.amenidad.upsert({
      where: { nombre },
      create: { nombre, activo: true, orden: i + 1 },
      update: { activo: true, orden: i + 1 },
    });
    resultado[nombre] = { id: row.id };
  }
  console.log(`  [amenidades] ${AMENIDADES.length} catalogadas`);
  return resultado;
}

// ---------------------------------------------------------------------------
// 3. ConfiguracionSistema (singleton)
// ---------------------------------------------------------------------------

async function seedConfiguracionSistema(adminId: string) {
  await ensureBucket();
  const genericaKey = "sistema/generica.png";
  await uploadPlaceholder(genericaKey);
  const genericaUrl = `${process.env.AWS_S3_ENDPOINT ?? "http://localhost:4566"}/${BUCKET}/${genericaKey}`;

  const existente = await prisma.configuracionSistema.findFirst();
  if (existente) {
    await prisma.configuracionSistema.update({
      where: { id: existente.id },
      data: {
        whatsappNumeroCentral: "+57 300 000 0000",
        whatsappPlantillaMensaje:
          "Hola, estoy interesado en la propiedad {codigo} - {titulo}. Podrias darme mas informacion?",
        nombreInmobiliaria: "Arrendadora DCH",
        imagenGenericaUrl: genericaUrl,
        actualizadaPor: adminId,
      },
    });
  } else {
    await prisma.configuracionSistema.create({
      data: {
        whatsappNumeroCentral: "+57 300 000 0000",
        whatsappPlantillaMensaje:
          "Hola, estoy interesado en la propiedad {codigo} - {titulo}. Podrias darme mas informacion?",
        nombreInmobiliaria: "Arrendadora DCH",
        imagenGenericaUrl: genericaUrl,
        actualizadaPor: adminId,
      },
    });
  }
  console.log(`  [configuracion_sistema] singleton listo (imagenGenericaUrl -> ${genericaUrl})`);
}

// ---------------------------------------------------------------------------
// 4. Propiedades + Fotos + Amenidades + Historial
// ---------------------------------------------------------------------------

const CIUDADES: { ciudad: string; barrios: string[]; lat: number; lng: number }[] = [
  { ciudad: "Bogota", barrios: ["Chapinero", "Usaquen", "Suba", "Kennedy"], lat: 4.711, lng: -74.0721 },
  { ciudad: "Medellin", barrios: ["El Poblado", "Laureles", "Envigado"], lat: 6.2442, lng: -75.5812 },
  { ciudad: "Cali", barrios: ["Granada", "Ciudad Jardin"], lat: 3.4516, lng: -76.532 },
  { ciudad: "Barranquilla", barrios: ["El Prado", "Alto Prado"], lat: 10.9639, lng: -74.7964 },
  { ciudad: "Cartagena", barrios: ["Bocagrande", "Manga"], lat: 10.391, lng: -75.4794 },
  { ciudad: "Bucaramanga", barrios: ["Cabecera", "Canaveral"], lat: 7.1193, lng: -73.1227 },
];

const AMENIDADES_POR_TIPO: Record<string, string[]> = {
  Apartamento: ["Piscina", "Gimnasio", "Parqueadero", "Ascensor"],
  Casa: ["Parqueadero", "Terraza", "Zona BBQ"],
  Oficina: ["Parqueadero", "Ascensor", "Vigilancia 24 horas"],
  "Local Comercial": ["Parqueadero", "Vigilancia 24 horas"],
  Lote: [],
};

const N_PROPIEDADES = 24;
const ESTADOS_CICLO: EstadoPropiedad[] = [
  "disponible",
  "disponible",
  "disponible",
  "reservada",
  "arrendada_vendida",
];

interface PropiedadSeed {
  codigo: string;
  slug: string;
  titulo: string;
  descripcion: string;
  tipoOperacion: TipoOperacion;
  tipoPropiedadNombre: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  precio: bigint;
  area: number;
  habitaciones: number;
  banos: number;
  estrato: number | null;
  parqueaderos: number | null;
  estado: EstadoPropiedad;
  destacada: boolean;
  archivada: boolean;
  latitud: number | null;
  longitud: number | null;
  publicadaEn: Date | null;
}

function generarPropiedades(): PropiedadSeed[] {
  const propiedades: PropiedadSeed[] = [];

  for (let i = 0; i < N_PROPIEDADES; i++) {
    const tipo = TIPOS_PROPIEDAD[i % TIPOS_PROPIEDAD.length];
    const ocurrencia = Math.floor(i / TIPOS_PROPIEDAD.length) + 1;
    const geo = CIUDADES[i % CIUDADES.length];
    const barrio = geo.barrios[i % geo.barrios.length];
    const tipoOperacion: TipoOperacion = i % 2 === 0 ? "arriendo" : "venta";
    const estado = ESTADOS_CICLO[i % ESTADOS_CICLO.length];
    const destacada = i % 6 === 0;
    const archivada = i === N_PROPIEDADES - 1; // solo la ultima, caso de borde deliberado

    const esResidencial = tipo.nombre === "Apartamento" || tipo.nombre === "Casa";
    const esComercial = tipo.nombre === "Oficina" || tipo.nombre === "Local Comercial";

    const area = esResidencial
      ? 45 + ocurrencia * 15 + (i % 3) * 10
      : esComercial
        ? 30 + ocurrencia * 12
        : 150 + ocurrencia * 60; // lote

    const habitaciones = esResidencial ? 1 + (i % 4) : 0;
    const banos = esResidencial ? 1 + (i % 3) : esComercial ? 1 + (i % 2) : 0;
    const estrato = esResidencial ? 1 + (i % 6) : null;
    const parqueaderos = tipo.nombre === "Lote" ? null : i % 4 === 3 ? 0 : 1 + (i % 3);

    const basePorM2 =
      tipoOperacion === "arriendo"
        ? esResidencial
          ? 22000
          : esComercial
            ? 28000
            : 3000
        : esResidencial
          ? 3200000
          : esComercial
            ? 3800000
            : 450000;

    const precioCrudo = area * basePorM2 * (1 + (i % 5) * 0.05);
    const precio = BigInt(Math.round(precioCrudo / 10000) * 10000);

    const codigo = `${tipo.prefijo}-${String(ocurrencia).padStart(3, "0")}`;
    const titulo = `${tipo.nombre} en ${tipoOperacion} en ${barrio}, ${geo.ciudad}`;
    const slug = slugify(`${titulo}-${codigo}`);

    propiedades.push({
      codigo,
      slug,
      titulo,
      descripcion: `${tipo.nombre} ubicado en el sector de ${barrio}, ${geo.ciudad}. Excelente ubicacion, cerca a vias principales y zonas comerciales. Ideal para ${tipoOperacion === "arriendo" ? "arrendar" : "invertir o vivir"}. Datos de prueba generados por seed de desarrollo — no representan un inmueble real.`,
      tipoOperacion,
      tipoPropiedadNombre: tipo.nombre,
      ciudad: geo.ciudad,
      barrio,
      direccion: `Calle ${10 + i} # ${(i * 3) % 90}-${(i * 7) % 80}`,
      precio,
      area,
      habitaciones,
      banos,
      estrato,
      parqueaderos,
      estado,
      destacada,
      archivada,
      latitud: geo.lat + ((i % 7) - 3) * 0.004,
      longitud: geo.lng + ((i % 5) - 2) * 0.004,
      publicadaEn: archivada ? null : new Date(Date.now() - ocurrencia * 86_400_000),
    });
  }

  return propiedades;
}

async function seedPropiedades(
  tipos: Record<string, { id: string; prefijo: string }>,
  amenidades: Record<string, { id: string }>,
  agenteId: string,
  adminId: string,
) {
  const propiedadesSeed = generarPropiedades();
  let creadas = 0;
  let actualizadas = 0;
  let fotosSubidas = 0;

  for (const p of propiedadesSeed) {
    const existente = await prisma.propiedad.findUnique({ where: { codigo: p.codigo } });

    const propiedad = await prisma.propiedad.upsert({
      where: { codigo: p.codigo },
      create: {
        codigo: p.codigo,
        titulo: p.titulo,
        slug: p.slug,
        descripcion: p.descripcion,
        tipoOperacion: p.tipoOperacion,
        tipoPropiedadId: tipos[p.tipoPropiedadNombre].id,
        ciudad: p.ciudad,
        barrio: p.barrio,
        direccion: p.direccion,
        precio: p.precio,
        area: p.area,
        habitaciones: p.habitaciones,
        banos: p.banos,
        estrato: p.estrato,
        parqueaderos: p.parqueaderos,
        estado: p.estado,
        destacada: p.destacada,
        archivada: p.archivada,
        agenteId,
        latitud: p.latitud,
        longitud: p.longitud,
        publicadaEn: p.publicadaEn,
      },
      update: {
        titulo: p.titulo,
        descripcion: p.descripcion,
        tipoOperacion: p.tipoOperacion,
        tipoPropiedadId: tipos[p.tipoPropiedadNombre].id,
        ciudad: p.ciudad,
        barrio: p.barrio,
        direccion: p.direccion,
        precio: p.precio,
        area: p.area,
        habitaciones: p.habitaciones,
        banos: p.banos,
        estrato: p.estrato,
        parqueaderos: p.parqueaderos,
        estado: p.estado,
        destacada: p.destacada,
        archivada: p.archivada,
        agenteId,
        latitud: p.latitud,
        longitud: p.longitud,
        publicadaEn: p.publicadaEn,
      },
    });

    if (existente) {
      actualizadas++;
    } else {
      creadas++;
      await prisma.historialEstadoPropiedad.create({
        data: {
          propiedadId: propiedad.id,
          estadoAnterior: "creado",
          estadoNuevo: propiedad.estado,
          usuarioId: adminId,
          nota: "Alta inicial via seed de desarrollo.",
        },
      });
    }

    // Amenidades (idempotente vía upsert por PK compuesta)
    const nombresAmenidad = AMENIDADES_POR_TIPO[p.tipoPropiedadNombre] ?? [];
    for (const nombreAmenidad of nombresAmenidad) {
      const amenidadId = amenidades[nombreAmenidad]?.id;
      if (!amenidadId) continue;
      await prisma.propiedadAmenidad.upsert({
        where: { propiedadId_amenidadId: { propiedadId: propiedad.id, amenidadId } },
        create: { propiedadId: propiedad.id, amenidadId, cantidad: 1 },
        update: {},
      });
    }

    // Foto de portada — solo si la propiedad todavia no tiene una (evita re-subir en cada run)
    const portadaExistente = await prisma.foto.findFirst({
      where: { propiedadId: propiedad.id, esPortada: true },
    });

    if (!portadaExistente) {
      const fotoId = randomUUID();
      const s3KeyBase = `propiedades/${propiedad.id}/${fotoId}`;
      await Promise.all([
        uploadPlaceholder(`${s3KeyBase}/original_optimizado.webp`),
        uploadPlaceholder(`${s3KeyBase}/card.webp`),
        uploadPlaceholder(`${s3KeyBase}/thumbnail.webp`),
      ]);
      await prisma.foto.create({
        data: {
          id: fotoId,
          propiedadId: propiedad.id,
          orden: 1,
          esPortada: true,
          s3KeyBase,
          formatoOriginal: "webp",
        },
      });
      fotosSubidas++;
    }
  }

  console.log(
    `  [propiedades] ${creadas} creadas, ${actualizadas} actualizadas, ${propiedadesSeed.length} total`,
  );
  console.log(`  [fotos] ${fotosSubidas} portadas subidas a S3 (bucket: ${BUCKET})`);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seed de desarrollo — Arrendadora API\n");

  console.log("1. Usuarios");
  const usuariosPorRol = await seedUsuarios();

  console.log("2. Catalogos");
  const tipos = await seedTiposPropiedad();
  const amenidades = await seedAmenidades();

  console.log("3. Configuracion del sistema");
  await seedConfiguracionSistema(usuariosPorRol.administrador.id);

  console.log("4. Propiedades, fotos, amenidades e historial");
  await seedPropiedades(tipos, amenidades, usuariosPorRol.agente.id, usuariosPorRol.administrador.id);

  console.log("\nSeed completado.");
}

main()
  .catch((err) => {
    console.error("Seed fallo:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
