/**
 * Seed idempotente (upsert por email) para el usuario Administrador de prueba
 * consumido por el pipeline ATF API (docs/testing/atf/config/credentials.yaml).
 *
 * Reutiliza el adaptador de hashing real del BC auth-usuarios
 * (`BcryptPasswordHasherAdapter`, bcryptjs costo 12 — ADR-004) para que el hash
 * persistido sea indistinguible de uno generado por el flujo de creación de
 * usuarios de la aplicación.
 *
 * Uso:
 *   bun prisma/seed-atf-admin.ts
 *
 * No es un artefacto efímero: queda en el repo como utilidad reutilizable para
 * re-sembrar el usuario de prueba ATF en cualquier entorno local.
 */
import { PrismaClient } from "@prisma/client";
import { BcryptPasswordHasherAdapter } from "../src/modules/auth-usuarios/infrastructure/security/bcrypt-password-hasher.adapter";

const EMAIL_ADMIN_ATF = "admin@arrendadora.test";
const PASSWORD_ADMIN_ATF = "Atf#Seed2026";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const hasher = new BcryptPasswordHasherAdapter();

  try {
    const passwordHash = await hasher.hash(PASSWORD_ADMIN_ATF);

    const usuario = await prisma.usuario.upsert({
      where: { email: EMAIL_ADMIN_ATF },
      update: {
        passwordHash,
        rol: "administrador",
        estado: "activo",
        requiereCambioPassword: false,
        intentosFallidos: 0,
      },
      create: {
        nombre: "Administrador ATF",
        email: EMAIL_ADMIN_ATF,
        passwordHash,
        rol: "administrador",
        estado: "activo",
        requiereCambioPassword: false,
        intentosFallidos: 0,
        whatsapp: null,
      },
      select: {
        id: true,
        email: true,
        rol: true,
        estado: true,
        requiereCambioPassword: true,
      },
    });

    console.log("Seed ATF admin OK:", JSON.stringify(usuario, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed ATF admin FALLÓ:", error);
  process.exitCode = 1;
});
