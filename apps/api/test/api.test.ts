import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { prisma } from '../src/db.js';

let app: FastifyInstance;
let token: string;
let slug: string;

const sampleModel = {
  brand: 'Test',
  name: 'Endurance One',
  discipline: 'road_endurance',
  active: true,
  sizes: [
    { sizeLabel: '54', stack: 562, reach: 384, seatTubeAngle: 73.5, headTubeAngle: 72.5 },
    { sizeLabel: '56', stack: 583, reach: 390, seatTubeAngle: 73, headTubeAngle: 73 },
    { sizeLabel: '58', stack: 605, reach: 397, seatTubeAngle: 73, headTubeAngle: 73.5 },
  ],
};

beforeAll(async () => {
  app = await buildServer();
  await app.ready();
  // Clean slate.
  await prisma.fitSession.deleteMany();
  await prisma.frameSize.deleteMany();
  await prisma.bikeModel.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  slug = `acme-${Date.now()}`;
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/signup',
    payload: {
      tenantName: 'Acme Bikes',
      tenantSlug: slug,
      email: 'owner@acme.test',
      password: 'supersecret123',
      name: 'Owner',
    },
  });
  expect(res.statusCode).toBe(201);
  token = res.json().token as string;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const auth = () => ({ authorization: `Bearer ${token}` });

describe('auth', () => {
  it('rejects unauthenticated catalog writes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/catalog/models',
      payload: sampleModel,
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns the current user from /me', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/auth/me', headers: auth() });
    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe('owner');
  });

  it('rejects duplicate tenant slug', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        tenantName: 'Dupe',
        tenantSlug: slug,
        email: 'x@dupe.test',
        password: 'supersecret123',
        name: 'X',
      },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('catalog + recommendation', () => {
  let modelId: string;

  it('creates a bike model', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/catalog/models',
      headers: auth(),
      payload: sampleModel,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.sizes).toHaveLength(3);
    modelId = body.id;
  });

  it('runs a recommendation and persists a session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/fit/recommend',
      headers: auth(),
      payload: {
        rider: {
          units: 'metric',
          measurements: { height: 180, inseam: 84 },
          profile: { discipline: 'road_endurance', flexibility: 'medium', experience: 'intermediate' },
        },
        persist: true,
        customerName: 'Jane Rider',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fit.saddleHeight).toBeGreaterThan(700);
    expect(body.recommendations.length).toBe(1);
    expect(body.recommendations[0].modelId).toBe(modelId);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(
      body.recommendations[0].confidence,
    );
    expect(body.sessionId).toBeTruthy();
  });

  it('lists persisted sessions', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/fit/sessions', headers: auth() });
    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBeGreaterThanOrEqual(1);
  });

  it('isolates tenants: a second tenant sees no models', async () => {
    const signup = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        tenantName: 'Other',
        tenantSlug: `other-${Date.now()}`,
        email: 'owner@other.test',
        password: 'supersecret123',
        name: 'Other Owner',
      },
    });
    const otherToken = signup.json().token as string;
    const res = await app.inject({
      method: 'GET',
      url: '/v1/catalog/models',
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(0);
  });
});

describe('api key + public config', () => {
  it('creates an API key and uses it for the widget recommend flow', async () => {
    const keyRes = await app.inject({
      method: 'POST',
      url: '/v1/tenant/api-keys',
      headers: auth(),
      payload: { name: 'Widget' },
    });
    expect(keyRes.statusCode).toBe(201);
    const apiKey = keyRes.json().key as string;
    expect(apiKey.startsWith('fwk_')).toBe(true);

    const rec = await app.inject({
      method: 'POST',
      url: '/v1/fit/recommend',
      headers: { 'x-api-key': apiKey },
      payload: {
        rider: {
          units: 'metric',
          measurements: { height: 175 },
          profile: { discipline: 'road_endurance', flexibility: 'medium', experience: 'beginner' },
        },
      },
    });
    expect(rec.statusCode).toBe(200);
    expect(rec.json().recommendations.length).toBe(1);
  });

  it('exposes public tenant config by slug', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/public/${slug}/config` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.tenant.slug).toBe(slug);
    expect(body.models.length).toBeGreaterThanOrEqual(1);
  });
});
