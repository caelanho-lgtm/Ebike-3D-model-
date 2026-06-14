import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password.js';
import { generateApiKey } from '../src/auth/apikey.js';

// Allow running via `tsx` without a preloaded .env file.
process.env.DATABASE_URL ||= 'file:./dev.db';

const prisma = new PrismaClient();

const DEMO_SLUG = 'demovelo';
const OWNER_EMAIL = 'owner@demovelo.cc';
const OWNER_PASSWORD = 'ChangeMe123!';

interface SeedSize {
  sizeLabel: string;
  stack: number;
  reach: number;
  seatTubeAngle: number;
  headTubeAngle: number;
  riderHeightMin?: number;
  riderHeightMax?: number;
}

interface SeedModel {
  brand: string;
  name: string;
  discipline: string;
  description: string;
  msrpCents: number;
  sizes: SeedSize[];
}

const MODELS: SeedModel[] = [
  {
    brand: 'Demovelo',
    name: 'Solstice Endurance',
    discipline: 'road_endurance',
    description: 'All-day endurance road bike with a relaxed, high-stack geometry.',
    msrpCents: 389900,
    sizes: [
      { sizeLabel: '49', stack: 522, reach: 372, seatTubeAngle: 74.5, headTubeAngle: 71, riderHeightMin: 1520, riderHeightMax: 1620 },
      { sizeLabel: '52', stack: 542, reach: 378, seatTubeAngle: 74, headTubeAngle: 71.5, riderHeightMin: 1610, riderHeightMax: 1700 },
      { sizeLabel: '54', stack: 562, reach: 384, seatTubeAngle: 73.5, headTubeAngle: 72.5, riderHeightMin: 1690, riderHeightMax: 1770 },
      { sizeLabel: '56', stack: 583, reach: 390, seatTubeAngle: 73, headTubeAngle: 73, riderHeightMin: 1760, riderHeightMax: 1840 },
      { sizeLabel: '58', stack: 605, reach: 397, seatTubeAngle: 73, headTubeAngle: 73.5, riderHeightMin: 1830, riderHeightMax: 1910 },
      { sizeLabel: '61', stack: 630, reach: 405, seatTubeAngle: 72.5, headTubeAngle: 73.5, riderHeightMin: 1900, riderHeightMax: 2000 },
    ],
  },
  {
    brand: 'Demovelo',
    name: 'Apex Aero',
    discipline: 'road_race',
    description: 'Low, aggressive aero race frame for performance-focused riders.',
    msrpCents: 749900,
    sizes: [
      { sizeLabel: '48', stack: 505, reach: 378, seatTubeAngle: 74.5, headTubeAngle: 71.5, riderHeightMin: 1520, riderHeightMax: 1630 },
      { sizeLabel: '51', stack: 525, reach: 386, seatTubeAngle: 74, headTubeAngle: 72.5, riderHeightMin: 1620, riderHeightMax: 1720 },
      { sizeLabel: '54', stack: 545, reach: 393, seatTubeAngle: 73.5, headTubeAngle: 73, riderHeightMin: 1710, riderHeightMax: 1800 },
      { sizeLabel: '56', stack: 565, reach: 400, seatTubeAngle: 73, headTubeAngle: 73.5, riderHeightMin: 1790, riderHeightMax: 1880 },
      { sizeLabel: '58', stack: 587, reach: 407, seatTubeAngle: 73, headTubeAngle: 73.5, riderHeightMin: 1870, riderHeightMax: 1970 },
    ],
  },
  {
    brand: 'Demovelo',
    name: 'Terra GRX',
    discipline: 'gravel',
    description: 'Versatile gravel/adventure bike with stable handling and clearance.',
    msrpCents: 449900,
    sizes: [
      { sizeLabel: 'S', stack: 560, reach: 375, seatTubeAngle: 74, headTubeAngle: 71, riderHeightMin: 1600, riderHeightMax: 1700 },
      { sizeLabel: 'M', stack: 585, reach: 388, seatTubeAngle: 73.5, headTubeAngle: 71.5, riderHeightMin: 1690, riderHeightMax: 1790 },
      { sizeLabel: 'L', stack: 610, reach: 400, seatTubeAngle: 73, headTubeAngle: 72, riderHeightMin: 1780, riderHeightMax: 1880 },
      { sizeLabel: 'XL', stack: 635, reach: 412, seatTubeAngle: 72.5, headTubeAngle: 72, riderHeightMin: 1870, riderHeightMax: 1980 },
    ],
  },
  {
    brand: 'Demovelo',
    name: 'Summit XC',
    discipline: 'mtb_xc',
    description: '29er cross-country hardtail tuned for efficient climbing.',
    msrpCents: 529900,
    sizes: [
      { sizeLabel: 'S', stack: 595, reach: 415, seatTubeAngle: 75, headTubeAngle: 67.5, riderHeightMin: 1550, riderHeightMax: 1680 },
      { sizeLabel: 'M', stack: 610, reach: 440, seatTubeAngle: 75, headTubeAngle: 67.5, riderHeightMin: 1670, riderHeightMax: 1780 },
      { sizeLabel: 'L', stack: 625, reach: 465, seatTubeAngle: 74.5, headTubeAngle: 67.5, riderHeightMin: 1770, riderHeightMax: 1880 },
      { sizeLabel: 'XL', stack: 640, reach: 490, seatTubeAngle: 74.5, headTubeAngle: 67.5, riderHeightMin: 1870, riderHeightMax: 2000 },
    ],
  },
  {
    brand: 'Demovelo',
    name: 'Velox TT',
    discipline: 'tt_triathlon',
    description: 'Time-trial / triathlon superbike with a steep, forward position.',
    msrpCents: 899900,
    sizes: [
      { sizeLabel: 'S', stack: 505, reach: 405, seatTubeAngle: 78, headTubeAngle: 72, riderHeightMin: 1600, riderHeightMax: 1720 },
      { sizeLabel: 'M', stack: 525, reach: 420, seatTubeAngle: 77.5, headTubeAngle: 72.5, riderHeightMin: 1710, riderHeightMax: 1830 },
      { sizeLabel: 'L', stack: 545, reach: 435, seatTubeAngle: 77, headTubeAngle: 73, riderHeightMin: 1820, riderHeightMax: 1950 },
    ],
  },
];

async function main() {
  // Idempotent: wipe and recreate the demo tenant.
  const existing = await prisma.tenant.findUnique({ where: { slug: DEMO_SLUG } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demovelo Bicycles',
      slug: DEMO_SLUG,
      primaryColor: '#0EA5E9',
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: OWNER_EMAIL,
      name: 'Dana Owner',
      role: 'owner',
      passwordHash: await hashPassword(OWNER_PASSWORD),
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'fitter@demovelo.cc',
      name: 'Frankie Fitter',
      role: 'fitter',
      passwordHash: await hashPassword(OWNER_PASSWORD),
    },
  });

  for (const model of MODELS) {
    await prisma.bikeModel.create({
      data: {
        tenantId: tenant.id,
        brand: model.brand,
        name: model.name,
        discipline: model.discipline,
        description: model.description,
        msrpCents: model.msrpCents,
        active: true,
        sizes: { create: model.sizes },
      },
    });
  }

  const { fullKey, prefix, keyHash } = generateApiKey();
  await prisma.apiKey.create({
    data: { tenantId: tenant.id, name: 'Demo widget key', prefix, keyHash },
  });

  // eslint-disable-next-line no-console
  console.log('\n✅ Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`   Tenant:     ${tenant.name} (slug: ${tenant.slug})`);
  // eslint-disable-next-line no-console
  console.log(`   Owner login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`   Models:      ${MODELS.length}`);
  // eslint-disable-next-line no-console
  console.log(`   Widget API key (store securely): ${fullKey}\n`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
