# Embedding Guide

## Install SDK

```bash
npm install @bikefit/embed-sdk
```

## Example integration

```ts
import { mountBikeFitWidget } from "@bikefit/embed-sdk";

const container = document.getElementById("bikefit-root");
if (container) {
  mountBikeFitWidget({
    container,
    widgetUrl: "https://widget.your-company.com",
    bikeModelId: "cm5f3z9vh0001n0j54n2qz4tc",
    theme: "light",
    heightPx: 760
  });
}
```

## Security recommendations

- Never expose dashboard JWTs in storefront JavaScript.
- Use tenant-scoped embed API keys and rotate keys periodically.
- Place a backend proxy between storefront and BikeFit API when possible.
- Allow-list storefront origins in platform tenant settings.
