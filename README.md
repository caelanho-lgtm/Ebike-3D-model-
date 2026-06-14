# FitWerx

**Multi-tenant SaaS platform for bicycle fitting, 3D visualization, and AI-driven bike sizing** — designed to be operated as a hosted dashboard by bike shops and brands, and embedded directly into their storefronts.

This is a production-oriented monorepo, not a demo: a tested biomechanical sizing engine, a multi-tenant API with real auth and tenant isolation, a 3D fitting dashboard, and a lightweight embeddable widget.

---

## Monorepo layout

```
fitwerx/
├── packages/
│   ├── fit-engine/     # Pure TS biomechanical sizing + AI recommendation engine (the core IP)
│   └── shared/         # Zod contracts/DTOs + unit conversion shared by every app
├── apps/
│   ├── api/            # Multi-tenant Fastify + Prisma REST API
│   ├── web/            # React + Vite dashboard with react-three-fiber 3D visualization
│   └── widget/         # Self-contained embeddable fitting widget (~12 KB)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict) across all packages |
| Monorepo | npm workspaces |
| API | Fastify 5, Prisma 5 (SQLite dev / PostgreSQL-ready), JWT + API keys |
| Web | React 18, Vite 6, `@react-three/fiber` + `drei`, Zustand |
| Widget | Vanilla TS, Shadow DOM, Vite library build (IIFE) |
| Tests | Vitest (engine unit tests + API integration tests) |

---

## Quick start

```bash
npm install

# 1. API
cp apps/api/.env.example apps/api/.env
npm run db:push  -w @fitwerx/api      # create the SQLite schema
npm run seed     -w @fitwerx/api      # seed a demo tenant + 5 bike models (+ prints an API key)
npm run dev      -w @fitwerx/api      # http://localhost:4000

# 2. Dashboard (in a second terminal)
npm run dev -w @fitwerx/web           # http://localhost:5173  (proxies /v1 -> :4000)

# 3. Widget (optional, in a third terminal)
npm run build -w @fitwerx/widget      # outputs apps/widget/dist/fitwerx-widget.js
```

Demo login (from the seed): `owner@demovelo.cc` / `ChangeMe123!`

### Docker

```bash
docker compose up --build
# dashboard -> http://localhost:8080 , api -> http://localhost:4000
```

---

## The fit engine (AI-driven sizing)

`@fitwerx/fit-engine` is dependency-free and unit-tested. It implements genuine
bike-fit science:

1. **Anthropometric resolution** — accepts whatever the rider provides (only
   height is required) and estimates the rest from validated height-proportional
   segment ratios, flagging which fields were estimated.
2. **Ideal fit coordinates** — saddle height (LeMond factor + crank correction),
   saddle setback / effective seat-tube angle, crank length, bar width and drop,
   and the rider's target frame **stack & reach** — all discipline-aware (road
   race/endurance, gravel, MTB XC/trail, TT/tri, commute) and scaled by
   flexibility, experience and age.
3. **Recommendation engine** — for every candidate frame size it solves the
   optimal stem length/angle, spacer stack and saddle setback to hit the rider's
   target cockpit point, scores the residual fit error on a 0–100 curve, applies
   a discipline-match penalty, and ranks models with a confidence label.

```ts
import { recommendBikes } from '@fitwerx/fit-engine';

const result = recommendBikes(
  { measurements: { height: 1820, inseam: 860 },
    profile: { discipline: 'road_endurance', flexibility: 'medium', experience: 'intermediate' } },
  catalog,            // BikeModel[] with frame geometry
);
// -> { fit, recommendations: [{ bestSize, confidence, ... }] }
```

## API overview

Base URL `/v1`. Auth via `Authorization: Bearer <jwt>` (dashboard users) or
`X-API-Key: fwk_...` (the embeddable widget). Roles: `viewer < fitter < admin < owner`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/v1/auth/signup` | – | Create tenant + owner |
| POST | `/v1/auth/login` | – | Log in |
| GET  | `/v1/auth/me` | any | Current principal |
| GET/PATCH | `/v1/tenant` | admin | Branding & settings |
| GET/POST | `/v1/tenant/users` | admin | User management |
| GET/POST/DELETE | `/v1/tenant/api-keys` | admin | Widget API keys |
| GET/POST/PUT/DELETE | `/v1/catalog/models` | viewer/fitter/admin | Bike catalog CRUD |
| POST | `/v1/fit/recommend` | any | **Fit + ranked recommendations** |
| GET | `/v1/fit/sessions[/:id]` | viewer | Saved fit history |
| GET | `/v1/public/:slug/config` | – | Widget bootstrap (branding + catalog) |

Multi-tenancy is enforced in the data layer: every tenant-scoped query is filtered
by the authenticated `tenantId`, so tenants can never read each other's catalog,
sessions, or users (covered by an integration test).

## Embedding the widget

```html
<div id="fitwerx-widget"></div>
<script src="https://app.yourbrand.com/widget/fitwerx-widget.js"
        data-tenant="your-shop-slug"
        data-api-key="fwk_your_public_key"
        data-api-base="https://api.yourbrand.com"></script>
```

The widget renders inside a Shadow DOM (no CSS collisions with the host site),
pulls branding from the public config endpoint, runs the fit through the keyed
API, and shows an SVG fit diagram plus ranked bike matches.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Build every workspace |
| `npm test` | Run all test suites |
| `npm run typecheck` | Typecheck every workspace |
| `npm run test:engine` | Fit-engine unit tests only |
| `npm run seed -w @fitwerx/api` | Seed the demo tenant |

## License

Apache-2.0
