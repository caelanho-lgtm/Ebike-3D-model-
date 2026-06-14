# BikeFit Enterprise Architecture

## Core principles

- **Strict tenant isolation:** every business object is keyed by `tenantId`.
- **Zero-trust embedding:** storefront widgets authenticate with scoped API keys and short-lived JWTs.
- **Composable services:** AI sizing logic is isolated into a versioned package (`@bikefit/ai-engine`).
- **Production hardening:** validated configuration, rate limiting, secure headers, structured logging.

## Service topology

1. **API service (`apps/api`)**
   - Tenant bootstrap and identity authentication
   - Bike model and geometry management
   - Sizing recommendation orchestration
   - Fit session event persistence and audit trail
2. **Widget frontend (`apps/widget`)**
   - 3D product visualization with Three.js
   - Embedded sizing flow for ecommerce/storefront pages
3. **AI engine package (`packages/ai-engine`)**
   - Deterministic fit scoring model
   - Unit-tested recommendation core

## Multi-tenant model

- `Tenant` is the top-level boundary.
- `User` joins tenants through `Membership` with role-based access.
- `BikeModel`, `ApiKey`, and `FitSession` are always queried by `tenantId`.
- Embed API keys are hashed at rest and can be rotated per tenant.

## Security controls

- JWT authentication for dashboard APIs.
- Scoped embed key authentication for storefront traffic.
- CORS allow-list with explicit origin.
- Rate limiting across public endpoints.
- Helmet headers for baseline browser protections.

## Embedding model

Brands and bike shops host the widget directly or in an iframe.
Recommended pattern:

1. Call `POST /v1/embed/sessions` from server-side middleware with the tenant-specific embed key.
2. Pass recommendation output and token to storefront page context.
3. Render widget and optionally sync with checkout personalization.
