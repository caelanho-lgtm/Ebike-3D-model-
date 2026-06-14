# BikeFit Enterprise SaaS Platform

Multi-tenant SaaS web platform for bicycle fitting, 3D product visualization, and AI-driven bike sizing.  
Designed for bicycle brands and bike shops embedding fit intelligence into ecommerce and dealer websites.

## Platform capabilities

- **Enterprise multi-tenancy**
  - Tenant-scoped data model (`tenantId` enforced across API queries)
  - Role-aware memberships (`owner`, future staff roles)
  - API key management model for embedded channels
- **Bike fitting + AI sizing**
  - Rider profile intake (inseam, torso, arm, flexibility, discipline)
  - Frame-size ranking and confidence scoring
  - Fit session persistence for analytics and support workflows
- **3D visualization widget**
  - React + Three.js scene rendering
  - Embeddable storefront experience
  - Calls secure embed sizing endpoint with tenant-scoped API key
- **Production hardening baseline**
  - Config schema validation (`zod`)
  - JWT auth + hashed API keys
  - CORS allow-list + Helmet + rate limiting
  - CI pipeline for typecheck, test, and build

## Monorepo structure

```txt
apps/
  api/       # Fastify + Prisma multi-tenant backend
  widget/    # React + Vite + Three.js embeddable frontend
packages/
  ai-engine/ # Versioned bike sizing engine
  embed-sdk/ # Client SDK for storefront embedding
docs/
  architecture.md
```

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Set a strong `JWT_SECRET` and ensure `DATABASE_URL` points to PostgreSQL.

### 3) Start local PostgreSQL (optional via Docker)

```bash
docker compose up -d postgres
```

### 4) Generate Prisma client and run API

```bash
npm run prisma:generate --workspace @bikefit/api
npm run dev --workspace @bikefit/api
```

### 5) Run widget

```bash
npm run dev --workspace @bikefit/widget
```

## API overview

- `POST /v1/tenants/bootstrap`  
  Creates tenant, owner account, and first embed API key.
- `POST /v1/auth/token`  
  Exchanges tenant credentials for dashboard JWT.
- `POST /v1/bikes` / `GET /v1/bikes`  
  Tenant-scoped bike model management.
- `POST /v1/sizing/predict`  
  Dashboard sizing recommendation endpoint.
- `POST /v1/embed/sessions`  
  Storefront endpoint using `x-embed-api-key`.

## Deployment

- Build containers with `docker compose build`.
- Run production stack with:

```bash
docker compose up -d
```

For architecture details and operational guidance, see [`docs/architecture.md`](docs/architecture.md).
For storefront implementation, see [`docs/embedding.md`](docs/embedding.md).
