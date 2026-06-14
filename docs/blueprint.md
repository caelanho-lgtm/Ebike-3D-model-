# Digital Twin Bicycle Fit Platform — Technical Blueprint

**Document type:** Implementation specification (v1.0)
**Audience:** Founding engineering team, ready to begin sprint 0
**Authoring team:** Bike Fitting Lead · Biomechanics Engineer · Product Manager · SaaS Architect · AI Engineer · Three.js/WebGL Engineer · UX Designer

This is a build document, not a pitch. It assumes you are standing up the repo this week. Where a real decision has trade-offs, the recommended option is stated and the rejected ones are named so you do not relitigate them.

-----

## 0. System overview

The product is a **deterministic biomechanics core** wrapped in a **real-time 3D experience**, delivered as an **embeddable multi-tenant widget** plus two operator consoles (Dealer, Brand).

Three architectural commitments shape everything below:

1. **The fit engine is a pure, deterministic TypeScript library** (`@dtf/fit-core`) that runs identically in the browser (instant feedback, offline-capable) and on the server (authoritative reports, comparison batch jobs). No fit math lives in React components or in SQL. Same input → same output, everywhere. This is the spine of the product and the root of the moat.
1. **The LLM never computes fit.** It *narrates* numbers the deterministic engine produced. This eliminates the entire class of “the AI hallucinated a saddle height” failures and keeps inference cost bounded and cacheable.
1. **Geometry is normalized into one canonical coordinate system at ingest.** A bike from a GLB export, a manufacturer CAD file, or a hand-keyed geometry chart all become the same `CanonicalBike` record anchored at the bottom bracket. The renderer and the engine never see vendor-specific formats.

```
                         ┌─────────────────────────────────────────────┐
   Embed <script> ─────► │  Embed Widget (React + R3F)                  │
   on brand site         │  - HologramRider  - BikeModel  - Gizmos      │
                         │  - @dtf/fit-core (runs client-side)          │
                         └───────┬───────────────────────┬─────────────┘
                                 │ fit events / sessions  │ asset CDN (GLB/KTX2)
                                 ▼                        ▼
   ┌──────────────┐      ┌───────────────┐        ┌──────────────┐
   │ Dealer Console│◄────►│  API Gateway  │◄──────►│  CloudFront  │
   │ Brand Portal  │      │ (NestJS, REST │        │  + S3 assets │
   └──────────────┘      │  + GraphQL)   │        └──────────────┘
                          └──┬───┬───┬────┘
            ┌────────────────┘   │   └─────────────────┐
            ▼                    ▼                      ▼
   ┌────────────────┐   ┌────────────────┐    ┌──────────────────┐
   │ Postgres (RLS) │   │ Redis (cache,  │    │ Fit/AI workers   │
   │ + Prisma       │   │ queue, presence)│    │ (BullMQ, fit-core│
   │ pgvector       │   └────────────────┘    │ + LLM narration) │
   └────────────────┘                          └──────────────────┘
```

-----

## 1. Product architecture

### 1.1 Surfaces

|Surface             |Tech                                                                           |Primary user                  |Delivery                                         |
|--------------------|-------------------------------------------------------------------------------|------------------------------|-------------------------------------------------|
|**Embed Widget**    |React 18 + R3F, bundled as a Web Component (`<dtf-fit>`) and an iframe fallback|Rider on a brand/retailer site|`<script>` tag + custom element, or signed iframe|
|**Dealer Console**  |Next.js app                                                                    |Fitter / shop staff           |`app.domain.com` (tenant-scoped)                 |
|**Brand Portal**    |Next.js app                                                                    |Manufacturer ops              |same app, role-gated                             |
|**Admin**           |Internal Next.js                                                               |Platform staff                |VPN-gated                                        |
|**Public API + SDK**|`@dtf/sdk` (TS)                                                                |Tenant developers             |npm + REST/GraphQL                               |

The Widget is the product; the consoles are revenue. Build the Widget first.

### 1.2 Bounded contexts (these map 1:1 to NestJS modules)

- **Identity & Tenancy** — tenants, users, roles, API keys, white-label config.
- **Catalog** — bikes, models, sizes, components, geometry, 3D assets.
- **Rider** — anthropometry profiles, body-type morph params, flexibility/style inputs.
- **Fit** — fit sessions, adjustments, computed metrics, snapshots, reports.
- **Comparison** — size-to-size and bike-to-bike diff jobs.
- **AI Coach** — narration, recommendation, knowledge base, feedback loop.
- **Analytics** — event ingestion, aggregation, dashboards.
- **Billing** — subscriptions, metering, entitlements.

Contexts communicate through an internal event bus (Redis Streams in MVP, EventBridge at scale). Example events: `fit.adjusted`, `fit.report.requested`, `bike.geometry.ingested`, `comparison.completed`. Analytics and AI subscribe; they never block the interactive path.

### 1.3 The digital-twin data flow (the core loop)

```
Rider inputs ──► RiderProfile ──┐
                                 ├──► fit-core.solve(rider, bike, adjustments)
CanonicalBike (from Catalog) ───┘            │
                                             ▼
                              FitState { contactPoints, jointAngles,
                                         metrics, flags, quality }
                          ┌──────────────────┼───────────────────┐
                          ▼                  ▼                   ▼
                    R3F renderer      Metrics HUD          AI Coach
                    (pose hologram)   (green/yellow/red)   (narrate deltas)
```

Every interactive frame runs `solve()` client-side (sub-millisecond, see §5). The server re-runs the identical function for authoritative report PDFs so a printed fit can never disagree with what the rider saw.

### 1.4 Build vs. buy

|Concern              |Decision                                                                                                                    |
|---------------------|----------------------------------------------------------------------------------------------------------------------------|
|3D engine            |**Build** on R3F/Three.js. No off-the-shelf configurator (Threekit etc.) — we need custom IK gizmos and the hologram shader.|
|Auth                 |**Buy** (Auth0 or AWS Cognito) for end-user + console SSO; issue our own short-lived widget tokens.                         |
|Billing              |**Buy** Stripe Billing for subscriptions + metered usage.                                                                   |
|CAD (STEP) conversion|**Buy/pipeline** — STEP→GLB is a server-side job using an OpenCASCADE-based converter; not a runtime concern.               |
|LLM                  |**Buy** API (Claude/OpenAI) for narration; **build** the deterministic recommender.                                         |
|Vector search        |**Build on pgvector** (avoid a second datastore until scale forces it).                                                     |

-----

## 2. UX architecture

### 2.1 Design language: “instrument, not toy”

The brief asks for Tesla / Vision Pro / Iron Man. Translated into concrete rules so it does not become neon soup:

- **Dark, low-chroma stage** with a single warm accent for the rider (“you”) and a single cool accent (cyan) for data/measurements. Color is information, never decoration.
- **The bike is the UI.** Components glow and lift on hover; grabbing one dims everything else and surfaces only the dimensions that component controls. No persistent slider wall.
- **Numbers are typeset like instrumentation** (monospace, fixed decimal places, units subordinated). Values animate by counting, not snapping.
- **Motion communicates causality.** When the rider drops the saddle, the leg extension readout and the knee-angle arc move on the *same* timeline so the cause/effect is legible.

### 2.2 Interaction model (direct manipulation)

The interface is a **selection → gizmo → constraint-drag** loop, identical on desktop and touch:

1. **Idle:** draggable components carry a subtle pulsing halo (affordance). A one-time coach toast names them.
1. **Hover/proximity:** component brightens, cursor → grab, a tooltip shows the live value it controls.
1. **Select (tap/click):** a context-appropriate **gizmo** appears — a linear rail for saddle height, an arc for stem angle/bar rotation, a fore/aft track for setback. Non-relevant geometry desaturates.
1. **Drag:** value updates in real time, constrained to the component’s mechanical envelope (you cannot drag a saddle past its rail). The relevant metric chips animate live.
1. **Release:** value commits to the fit session; AI Coach debounces (~600 ms) then narrates the change.

Each adjustable maps to a gizmo type:

|Component|Adjustments                    |Gizmo                                                     |Constraint                                         |
|---------|-------------------------------|----------------------------------------------------------|---------------------------------------------------|
|Saddle   |height, setback, fore/aft, tilt|rail (height along seat tube) + fore/aft track + tilt dial|seatpost length, rail length, ±UCI-style tilt range|
|Stem     |angle, length, spacer stack    |arc about steerer + length handle + stack stepper         |steerer length, stock stem lengths                 |
|Handlebar|reach, rotation, width         |rotation dial about clamp + width handle                  |bar model limits                                   |
|Crank    |length                         |discrete stepper                                          |available crank lengths                            |

### 2.3 Information architecture (Widget)

```
┌───────────────────────────────────────────────┐
│  Stage (3D)                          [⤢ AR]    │
│   hologram rider + bike + gizmos               │
│                                                │
│   ┌ metric HUD (collapsible) ┐                 │
│   │ knee 145° ● hip 42° ●     │                │
│   │ reach 412 ● drop +58 ●    │                │
│   └──────────────────────────┘                 │
│                                  ┌ AI Coach ┐  │
│  [ Body ] [ Size S M L XL ] [Compare]  │ … │  │
└───────────────────────────────────────────────┘
```

- **Body sheet** (slide-over): the anthropometry + style/flexibility inputs. Collapsed after first run.
- **Size segmented control:** instant S/M/L/XL swap, rider constant.
- **Compare:** enters split or ghosted overlay mode (§ comparison).
- **AI Coach panel:** persistent on desktop, bottom-sheet on mobile.

### 2.4 Responsive strategy

One React tree, three layouts driven by container queries (the widget can be 380 px in a sidebar or full-bleed): **stage-dominant** (mobile, controls become bottom sheets), **stage + rail** (tablet), **stage + rail + persistent coach** (desktop). The 3D canvas adopts an adaptive DPR and quality tier (§8) rather than a separate mobile codebase.

### 2.5 Accessibility & fallback

- Every gizmo has a keyboard equivalent (focus component → arrow keys nudge, with the same constraints) and an ARIA live region announcing committed values. The slider rail is not deleted; it is demoted into an “a11y / precision” disclosure so keyboard and screen-reader users — and precise data entry — are never blocked.
- WebGL-unavailable fallback: a 2D SVG sagittal-plane renderer driven by the same `FitState` (the engine output is render-agnostic). Degraded, not broken.
- Respect `prefers-reduced-motion` (no idle hologram shimmer, no count-up).

-----

> **Note — document continues.** Sections 3+ (canonical data & domain model, the
> fit-engine internals and `windows.ts` quality bands, comparison jobs, AI Coach,
> analytics, billing, infra/perf, and the delivery roadmap) are part of the full
> specification and are not reproduced in this excerpt. For day-to-day work,
> `CLAUDE.md` is the operative quick-reference and `docs/prototype.html` is the
> reference implementation to port (see §1.3 for the core `solve()` loop and the
> Coordinate/biomechanics reference in `CLAUDE.md`).
