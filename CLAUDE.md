# CLAUDE.md

Guidance for AI coding agents (and humans) working in this repository.

## What this is

**FitWerx** — a multi-tenant SaaS platform for bicycle fitting, 3D visualization,
and AI-driven bike sizing. It is operated as a hosted dashboard by bike shops /
brands and embedded into their storefronts via a widget.

It is a strict-TypeScript **npm-workspaces monorepo**. Node >= 20, npm >= 10.

```
packages/fit-engine   Pure TS biomechanical sizing + recommendation engine (no deps). The core IP.
packages/shared       Zod contracts/DTOs + unit conversion. Source of truth for API/web/widget types.
apps/api              Fastify 5 + Prisma 5 multi-tenant REST API (SQLite dev / PostgreSQL-ready).
apps/web              React 18 + Vite 6 dashboard; react-three-fiber 3D viewer.
apps/widget           Vanilla-TS, Shadow-DOM embeddable widget; Vite IIFE library build (~12 KB).
```

Dependency direction: `fit-engine` ← `shared` ← (`api`, `web`, `widget`).
Always build `fit-engine` and `shared` before the apps consume them.

## Commands

Run from the repo root unless noted. `-w <name>` targets a single workspace.

```bash
npm install                      # install all workspaces
npm run build                    # build every workspace (engine → shared → apps)
npm test                         # run all test suites (Vitest)
npm run typecheck                # typecheck every workspace
npm run test:engine              # fit-engine unit tests only

# API
cp apps/api/.env.example apps/api/.env
npm run db:push   -w @fitwerx/api    # apply Prisma schema to SQLite
npm run seed      -w @fitwerx/api    # seed demo tenant + 5 models (prints an API key)
npm run dev       -w @fitwerx/api    # http://localhost:4000  (tsx watch)
npm run prisma:generate -w @fitwerx/api  # regenerate the Prisma client after schema changes

# Web (proxies /v1 -> :4000)
npm run dev   -w @fitwerx/web        # http://localhost:5173

# Widget
npm run build -w @fitwerx/widget     # -> apps/widget/dist/fitwerx-widget.js
```

Docker: `docker compose up --build` (web :8080, api :4000).
Demo login from the seed: `owner@demovelo.cc` / `ChangeMe123!`.

## Important conventions

- **ESM + `.js` import specifiers.** All workspaces are `"type": "module"`. In TS
  source, import sibling files with the `.js` extension (e.g. `import './fit.js'`).
  This is required for the Node/ESM runtime output; Vitest/Vite resolve `.js`→`.ts`.
- **Units.** The fit engine is internally **millimetres / degrees**. Client DTOs
  accept centimetres (or inches); convert with `toEngineRider` from `@fitwerx/shared`.
  Don't mix units inside the engine.
- **Contracts first.** Add/extend Zod schemas in `packages/shared` and infer TS
  types from them. API routes validate input with these schemas; web/widget reuse
  the inferred types. Don't hand-write duplicate interfaces.
- **Multi-tenancy is enforced in code, not the DB.** Every tenant-scoped Prisma
  query MUST filter by the authenticated `req.auth.tenantId`. Never trust a
  tenant/id from the request body. There is a tenant-isolation integration test —
  keep it passing.
- **Auth.** Dashboard users → JWT (`Authorization: Bearer`). Widget / server-to-
  server → API key (`X-API-Key: fwk_...`). Roles: `viewer < fitter < admin < owner`;
  guard routes with `app.requireAuth` / `app.requireRole('...')`.
- **Errors.** Throw the helpers in `apps/api/src/http.ts` (`badRequest`,
  `unauthorized`, `forbidden`, `notFound`, `conflict`). The global handler maps
  them to the stable `{ error: { code, message, details } }` envelope.
- **Secrets.** Passwords are scrypt-hashed; API keys are stored as SHA-256 and the
  plaintext is shown exactly once at creation. Never log or persist plaintext keys.
- **3D / WebGL.** The `BikeViewer` is wrapped in an `ErrorBoundary` so WebGL-less
  browsers degrade gracefully — keep new 3D usage inside a boundary.

## The fit engine

- `anthropometry.ts` — validate + resolve/estimate measurements.
- `fit.ts` — `computeFit()` → ideal fit coordinates (discipline/flex/age aware).
- `geometry.ts` — pure helpers (`solveCockpitPoint`, setback↔seat-angle, snapping).
- `recommend.ts` — `recommendBikes()` solves stem/spacer/setback per frame size,
  scores residual error 0–100, ranks models with a confidence label.
- Tuning coefficients live in `constants.ts` (`DISCIPLINE_PROFILES`, ratios, etc.).
  When you change a coefficient, update/extend the unit tests accordingly.

## Database / Prisma

- Schema: `apps/api/prisma/schema.prisma`. JSON payloads are stored as TEXT for
  SQLite/PostgreSQL portability (serialize/parse in code).
- After editing the schema: `npm run prisma:generate -w @fitwerx/api` then
  `npm run db:push -w @fitwerx/api` (dev) or create a migration for prod.
- To move to PostgreSQL: switch `provider` in the schema and point `DATABASE_URL`
  at Postgres (see commented `db` service in `docker-compose.yml`).

## Testing expectations

- `packages/fit-engine`: unit tests colocated as `*.test.ts`.
- `apps/api`: integration tests in `test/`, run against a throwaway SQLite db
  provisioned by `test/global-setup.ts` (rate limiting is disabled in `test`).
- Before considering a change done: `npm run typecheck && npm run build && npm test`
  must all pass.

## Gotchas

- Don't commit `.env`, `*.sqlite`/`*.db`, or `dist/` (already gitignored).
- Two `vite` copies can appear under workspaces; `web`/`widget` typecheck with
  `tsc --noEmit` and let Vite build its own config (don't add `vite.config.ts`
  to `tsconfig` `include`).
- The seed is idempotent (it wipes and recreates the `demovelo` tenant).
