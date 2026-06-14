# VeloFit Enterprise

Production-ready foundation for a multi-tenant bicycle fitting SaaS that can be embedded into
bicycle brand and bike shop websites.

## Capabilities

- Multi-tenant tenant registry with domain resolution, feature flags, themes, and origin allowlists.
- AI-ready bike sizing workflow with deterministic fallback, model disclosure, request audit IDs, and
  explainable reach/stack/standover scoring.
- White-label embed experience at `/embed/[tenantSlug]` and drop-in script at
  `/embed/[tenantSlug]/script`.
- Versioned API surface:
  - `GET /api/v1/tenants`
  - `POST /api/v1/sizing`
- Interactive 3D bicycle visualization powered by React Three Fiber.
- Strict TypeScript, ESLint, Next.js security headers, consent validation, and focused unit tests.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and submit the sizing intake.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Embed snippet

```html
<div id="bike-fit-widget"></div>
<script
  src="https://your-velofit-host.example.com/embed/velo-north/script"
  data-target="bike-fit-widget"
  async
></script>
```

## API example

```bash
curl -X POST http://localhost:3000/api/v1/sizing \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSlug": "velo-north",
    "source": "api",
    "consent": {
      "biomechanicsProcessing": true,
      "marketingOptIn": false
    },
    "profile": {
      "measurements": {
        "heightMm": 1780,
        "inseamMm": 835,
        "torsoMm": 620,
        "armMm": 660,
        "shoulderMm": 430,
        "weightKg": 78,
        "flexibilityScore": 6
      },
      "intent": "endurance",
      "category": "road",
      "experienceYears": 4
    }
  }'
```

## Production notes

This repository includes in-memory tenant and catalog data to keep the code runnable in isolated
environments. For a live deployment, replace `lib/domain/tenant-registry.ts` with a database-backed
repository and connect the `SizingAiProvider` interface in `lib/domain/ai-sizing-service.ts` to an
approved LLM provider or internal sizing model.
