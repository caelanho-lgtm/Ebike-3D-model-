# API Examples

## Bootstrap tenant

```bash
curl -X POST http://localhost:8080/v1/tenants/bootstrap \
  -H "content-type: application/json" \
  -d '{
    "slug": "acme-bikes",
    "displayName": "ACME Bikes",
    "admin": {
      "email": "owner@acme.com",
      "fullName": "Owner User",
      "password": "SuperStrongPass!123"
    }
  }'
```

## Authenticate dashboard user

```bash
curl -X POST http://localhost:8080/v1/auth/token \
  -H "content-type: application/json" \
  -d '{
    "tenantSlug": "acme-bikes",
    "email": "owner@acme.com",
    "password": "SuperStrongPass!123"
  }'
```

## Create bike model

```bash
curl -X POST http://localhost:8080/v1/bikes \
  -H "authorization: Bearer <JWT>" \
  -H "content-type: application/json" \
  -d '{
    "modelName": "Aero Carbon",
    "discipline": "road",
    "geometry": { "headTubeAngle": 73.5, "seatTubeAngle": 74.2 },
    "frameOptions": [
      { "frameLabel": "52", "stackMm": 545, "reachMm": 379, "topTubeMm": 535 },
      { "frameLabel": "54", "stackMm": 562, "reachMm": 387, "topTubeMm": 548 }
    ]
  }'
```

## Request storefront sizing

```bash
curl -X POST http://localhost:8080/v1/embed/sessions \
  -H "x-embed-api-key: <EMBED_API_KEY>" \
  -H "content-type: application/json" \
  -d '{
    "bikeModelId": "<BIKE_MODEL_ID>",
    "riderProfile": {
      "inseamCm": 82,
      "torsoCm": 60,
      "armCm": 63,
      "heightCm": 178,
      "flexibilityScore": 6,
      "discipline": "road"
    }
  }'
```
