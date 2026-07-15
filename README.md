# Arrendadora — Plataforma web inmobiliaria

Monorepo TypeScript full-stack (pnpm workspaces). Ver `docs/architecture/decisions/` para las
decisiones de arquitectura (ADR-001 estilo hexagonal, ADR-002 stack, ADR-003 persistencia).

## Estructura

```
apps/
  api/            → Backend NestJS (monolito modular hexagonal, 5 bounded contexts)
  portal/         → Portal público — Next.js SSR/SSG, SEO y Open Graph (ADR-002, ADR-010)
  admin/          → Panel administrativo — React SPA (Vite), interno sin SEO (ADR-002)
packages/
  shared/         → Tipos y DTOs compartidos (paginación, errores ADR-015, Propiedad)
  design-tokens/  → Design tokens base (color, tipografía, espaciado) compartidos por portal/admin
```

> **Estado actual: scaffolding.** `apps/portal` y `apps/admin` tienen estructura, routing
> esqueleto y datos mock — sin lógica de negocio ni fetch real a la API todavía. Ver el
> `CLAUDE.md` de cada app para el detalle.

## Requisitos

- Node.js >= 20
- pnpm 9.x (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- PostgreSQL 15+ (para `apps/api`)

## Comandos

```bash
pnpm install              # instalar dependencias de todo el workspace
pnpm run build             # build de packages y apps en orden topológico (necesario antes del primer dev)
pnpm run dev:api           # levantar la API en modo watch
pnpm run dev:portal        # levantar el portal (Next.js) en modo dev
pnpm run dev:admin         # levantar el panel admin (Vite) en modo dev
pnpm typecheck             # typecheck de todo el workspace
pnpm lint                  # lint de todo el workspace
```

## Documentación

- Decisiones de arquitectura: `docs/architecture/decisions/`
- Contratos OpenAPI: `docs/architecture/contracts/`
- ERD y bounded context map: `docs/architecture/diagrams/`
- CLAUDE.md de cada módulo: `apps/api/CLAUDE.md`, `apps/portal/CLAUDE.md`, `apps/admin/CLAUDE.md`
