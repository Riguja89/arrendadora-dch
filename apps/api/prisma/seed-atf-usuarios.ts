/**
 * Seed idempotente (upsert por email) de las 3 cuentas base consumidas por el
 * pipeline ATF API (docs/testing/atf/config/credentials.yaml -> environments.qa.roles):
 * administrador, agente y editor.
 *
 * Reemplaza en alcance a seed-atf-admin.ts (que solo cubría admin) -- se mantiene
 * ese archivo por compatibilidad, pero seed-atf-usuarios.ts es el script recomendado
 * para preparar el entorno QA antes de una corrida ATF completa (Fase 5 — Execute).
 *
 * Reutiliza el adaptador de hashing real del BC auth-usuarios
 * (`BcryptPasswordHasherAdapter`, bcryptjs costo 12 — ADR-004) para que el hash
 * persistido sea indistinguible de uno generado por el flujo de creación de
 * usuarios de la aplicación.
 *
 * Convención de email: {rol}@arrendadora.test (mismo dominio que el admin ATF
 * ya sembrado). Alineado con helpers/session-manager.ts y credentials.yaml del
 * run arrendadora-api-v1.0-20260721-0706 (remediación D-002).
 *
 * Uso:
 *   bun prisma/seed-atf-usuarios.ts
 */
import { PrismaClient } from "@prisma/client";
import { BcryptPasswordHasherAdapter } from "../src/modules/auth-usuarios/infrastructure/security/bcrypt-password-hasher.adapter";

interface SeedUser {
  nombre: string;
  email: string;
  password: string;
  rol: "administrador" | "agente" | "editor";
  whatsapp: string | null;
}

// Passwords cumplen RN-034 (>=8 chars, mayuscula+minuscula+numero). Whatsapp en
// formato colombiano valido (RN-038 / rule_compliance de design/fixtures-wi-001.json)
// para el rol agente, aunque el use-case actual lo trate como opcional (ver
// crear-usuario.use-case.ts nota "RN-038 superseded por GAP-002").
const USERS: SeedUser[] = [
  {
    nombre: "Administrador ATF",
    email: "admin@arrendadora.test",
    password: "Atf#Seed2026",
    rol: "administrador",
    whatsapp: null,
  },
  {
    nombre: "Agente ATF",
    email: "agente@arrendadora.test",
    password: "AtfAgente#26",
    rol: "agente",
    whatsapp: "+573001234567",
  },
  {
    nombre: "Editor ATF",
    email: "editor@arrendadora.test",
    password: "AtfEditor#26",
    rol: "editor",
    whatsapp: null,
  },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const hasher = new BcryptPasswordHasherAdapter();

  try {
    for (const u of USERS) {
      const passwordHash = await hasher.hash(u.password);
      const usuario = await prisma.usuario.upsert({
        where: { email: u.email },
        update: {
          passwordHash,
          rol: u.rol,
          estado: "activo",
          requiereCambioPassword: false,
          intentosFallidos: 0,
          whatsapp: u.whatsapp,
        },
        create: {
          nombre: u.nombre,
          email: u.email,
          passwordHash,
          rol: u.rol,
          estado: "activo",
          requiereCambioPassword: false,
          intentosFallidos: 0,
          whatsapp: u.whatsapp,
        },
        select: { id: true, email: true, rol: true, estado: true, requiereCambioPassword: true },
      });
      console.log(`Seed OK [${u.rol}]:`, JSON.stringify(usuario));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed ATF usuarios FALLÓ:", error);
  process.exitCode = 1;
});
