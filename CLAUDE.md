# CLAUDE.md — Digital Twin Bicycle Fit Platform

This file is read by Claude Code at the start of every session. Keep it short, current, and authoritative. When an architectural decision changes, update this file in the same PR.

## What we’re building

An embeddable, multi-tenant 3D bike-fit platform. A rider enters body measurements, sees a holographic human model posed on a real bicycle’s geometry, and directly manipulates components (saddle, stem, bars, cranks) to see fit/biomechanics update in real time. Licensed to brands, retailers, e-bike companies, and fit studios. See `docs/blueprint.md` for the full spec.

## Non-negotiable architecture principles

1. **The fit engine is a pure, deterministic TypeScript package** (`packages/fit-core`). Same input → same output. It runs unchanged in the browser (interactive) AND on the server (authoritative reports). NEVER put fit math in React components, hooks, or SQL.
1. **The LLM narrates; it never computes.** The deterministic engine produces all numbers, flags, and recommendations. The AI Coach only explains deltas in plain language. No fit value ever originates from an LLM.
1. **Geometry is normalized at ingest** into one `CanonicalBike` type anchored at the bottom bracket (origin = BB, +x toward front wheel, +y up, metres). GLB/glTF/STEP/CAD/geometry-chart all converge to this. Renderer and engine never see vendor formats.
1. **Render-agnostic engine output.** `solve()` returns a `FitState` that any renderer (R3F, or the 2D SVG fallback) can draw. Don’t couple the engine to Three.js.

## Monorepo layout (pnpm + Turborepo)

```
apps/
  widget/        # embeddable React+R3F fit experience (Web Component + iframe)
  console/       # Next.js: Dealer Console + Brand Portal (role-gated)
  api/           # NestJS: REST + GraphQL, modules per bounded context
packages/
  fit-core/      # ⭐ deterministic biomechanics engine (no deps on React/Three)
  geometry/      # CanonicalBike types, ingest/normalization, validators
  three-kit/     # R3F components: HologramRider, BikeModel, gizmos, holo shader
  ui/            # shared design-system (Tailwind tokens, primitives)
  sdk/           # @dtf/sdk — public TS client for tenants
  db/            # Prisma schema + migrations + RLS policies
  config/        # tsconfig, eslint, tailwind preset
```

## Tech stack (locked)

Frontend: React 18, TypeScript (strict), Three.js + React Three Fiber + drei, Zustand, Tailwind. Backend: NestJS, PostgreSQL + Prisma, Redis, BullMQ. Vectors: pgvector. Cloud: AWS (ECS Fargate, RDS, ElastiCache, S3+CloudFront). Auth: Cognito/Auth0 for users; short-lived signed JWT for widget embeds. Billing: Stripe.

## Conventions

- TypeScript strict everywhere; no `any` in `fit-core` or `geometry`.
- `fit-core` is framework-free and 100% unit-tested with golden-value fixtures. A change to engine output MUST update fixtures in the same PR and explain the delta.
- Units: SI internally (metres, radians). Convert to mm/degrees only at display boundaries.
- Multi-tenant: every tenant-owned row carries `tenant_id`; enforce with Postgres RLS, not app-layer filtering alone.
- Conventional Commits. Feature work behind flags. No fit math without a test.

## Coordinate + biomechanics reference (so we stay consistent)

- World: origin at BB, metres, sagittal plane is z≈0; rider faces +x.
- Contact points solved in order: bottom bracket/pedal → saddle → grips.
- Reported angles (degrees): knee extension (at knee, hip–knee–ankle), hip, back/torso-from-horizontal, shoulder, elbow. Quality bands live in `fit-core/src/windows.ts` — single source of truth, reused by HUD colors and AI Coach.

## Definition of done

Typed, tested (engine: golden fixtures; UI: interaction tests), accessible (keyboard gizmo equivalents + ARIA live values), works at 380px width and on mobile at 60fps target, and behind a flag if user-facing.

## Good first prompts for Claude Code

- “Scaffold the pnpm + Turborepo monorepo exactly as in CLAUDE.md, with empty typed package entry points and a passing CI lint/test pipeline.”
- “In packages/geometry, implement the CanonicalBike type and a normalizer that ingests a geometry chart (stack, reach, HTA, STA, chainstay, etc.) into it, with validators and tests.”
- “In packages/fit-core, port the IK + biomechanics solver from docs/prototype.html into a pure, tested module exposing solve(rider, bike, adjustments) -> FitState.”
- “In packages/three-kit, rebuild the holographic rider and draggable gizmos from docs/prototype.html as R3F components driven by FitState.”
