import type { BikeModel, Tenant } from "./types";

export const tenants: Tenant[] = [
  {
    id: "tn_velo_north",
    slug: "velo-north",
    displayName: "Velo North",
    plan: "enterprise",
    domains: ["velo-north.example.com", "localhost"],
    locale: "en-US",
    theme: {
      primary: "#0f766e",
      accent: "#f59e0b",
      surface: "#f8fafc",
      text: "#0f172a",
      radius: "rounded"
    },
    integration: {
      allowedOrigins: ["https://velo-north.example.com", "http://localhost:3000"],
      apiKeyHint: "vn_live_****6a19",
      ssoEnabled: true
    },
    featureFlags: {
      aiSizing: true,
      threeDimensionalFit: true,
      dealerHandoff: true,
      whiteLabelEmbeds: true
    }
  },
  {
    id: "tn_apex_cycles",
    slug: "apex-cycles",
    displayName: "Apex Cycles",
    plan: "brand",
    domains: ["apex-cycles.example.com"],
    locale: "en-GB",
    theme: {
      primary: "#1d4ed8",
      accent: "#22c55e",
      surface: "#f1f5f9",
      text: "#111827",
      radius: "soft"
    },
    integration: {
      allowedOrigins: ["https://apex-cycles.example.com"],
      apiKeyHint: "apx_live_****91bf",
      ssoEnabled: false
    },
    featureFlags: {
      aiSizing: true,
      threeDimensionalFit: true,
      dealerHandoff: false,
      whiteLabelEmbeds: true
    }
  }
];

export const bikeCatalog: BikeModel[] = [
  {
    id: "bike_aurora_road",
    tenantId: "tn_velo_north",
    name: "Aurora Road",
    category: "road",
    frameSizes: [
      {
        label: "XS",
        seatTubeMm: 470,
        topTubeMm: 510,
        stackMm: 515,
        reachMm: 370,
        standoverMm: 730,
        headTubeAngleDeg: 71.5,
        seatTubeAngleDeg: 74.5,
        wheelbaseMm: 976
      },
      {
        label: "S",
        seatTubeMm: 500,
        topTubeMm: 535,
        stackMm: 540,
        reachMm: 382,
        standoverMm: 758,
        headTubeAngleDeg: 72.2,
        seatTubeAngleDeg: 74,
        wheelbaseMm: 988
      },
      {
        label: "M",
        seatTubeMm: 530,
        topTubeMm: 555,
        stackMm: 565,
        reachMm: 392,
        standoverMm: 790,
        headTubeAngleDeg: 73,
        seatTubeAngleDeg: 73.5,
        wheelbaseMm: 997
      },
      {
        label: "L",
        seatTubeMm: 560,
        topTubeMm: 575,
        stackMm: 590,
        reachMm: 402,
        standoverMm: 817,
        headTubeAngleDeg: 73.3,
        seatTubeAngleDeg: 73,
        wheelbaseMm: 1012
      }
    ]
  },
  {
    id: "bike_terrain_e",
    tenantId: "tn_velo_north",
    name: "Terrain-E",
    category: "ebike",
    frameSizes: [
      {
        label: "S/M",
        seatTubeMm: 430,
        topTubeMm: 585,
        stackMm: 620,
        reachMm: 410,
        standoverMm: 720,
        headTubeAngleDeg: 68.5,
        seatTubeAngleDeg: 74,
        wheelbaseMm: 1175
      },
      {
        label: "M/L",
        seatTubeMm: 470,
        topTubeMm: 610,
        stackMm: 645,
        reachMm: 430,
        standoverMm: 750,
        headTubeAngleDeg: 68.5,
        seatTubeAngleDeg: 74,
        wheelbaseMm: 1202
      }
    ]
  },
  {
    id: "bike_apex_gravel",
    tenantId: "tn_apex_cycles",
    name: "Apex Gravel Pro",
    category: "gravel",
    frameSizes: [
      {
        label: "49",
        seatTubeMm: 490,
        topTubeMm: 525,
        stackMm: 545,
        reachMm: 374,
        standoverMm: 745,
        headTubeAngleDeg: 70.5,
        seatTubeAngleDeg: 74,
        wheelbaseMm: 1010
      },
      {
        label: "53",
        seatTubeMm: 530,
        topTubeMm: 555,
        stackMm: 575,
        reachMm: 387,
        standoverMm: 782,
        headTubeAngleDeg: 71,
        seatTubeAngleDeg: 73.5,
        wheelbaseMm: 1028
      },
      {
        label: "57",
        seatTubeMm: 570,
        topTubeMm: 585,
        stackMm: 605,
        reachMm: 402,
        standoverMm: 820,
        headTubeAngleDeg: 71.5,
        seatTubeAngleDeg: 73,
        wheelbaseMm: 1044
      }
    ]
  }
];

export function resolveTenantFromHost(hostname?: string | null): Tenant {
  if (!hostname) {
    return tenants[0];
  }

  const normalizedHost = hostname.split(":")[0]?.toLowerCase() ?? "";
  return (
    tenants.find((tenant) =>
      tenant.domains.some((domain) => domain.toLowerCase() === normalizedHost)
    ) ?? tenants[0]
  );
}

export function resolveTenantFromSlug(slug: string): Tenant | undefined {
  return tenants.find((tenant) => tenant.slug === slug);
}

export function getTenantBikes(tenantId: string): BikeModel[] {
  return bikeCatalog.filter((bike) => bike.tenantId === tenantId);
}
