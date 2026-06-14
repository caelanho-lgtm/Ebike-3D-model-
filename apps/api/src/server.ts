import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { recommendBikeSize } from "@bikefit/ai-engine";
import { getConfig, type AppConfig } from "./config.js";
import { prisma } from "./db.js";
import { hashApiKey, hashPassword, requireEmbedApiKey, requireTenantAuth, verifyPassword } from "./auth.js";
import "./types.js";

const tenantBootstrapSchema = z.object({
  slug: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(2).max(120),
  admin: z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(120),
    password: z.string().min(10).max(200)
  })
});

const tokenSchema = z.object({
  tenantSlug: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(1)
});

const bikeCreateSchema = z.object({
  modelName: z.string().min(2).max(120),
  discipline: z.enum(["road", "gravel", "mtb", "triathlon"]),
  geometry: z.record(z.string(), z.number()),
  frameOptions: z
    .array(
      z.object({
        frameLabel: z.string().min(1),
        stackMm: z.number(),
        reachMm: z.number(),
        topTubeMm: z.number()
      })
    )
    .min(1)
});

const sizingSchema = z.object({
  bikeModelId: z.string().min(1),
  riderProfile: z.object({
    inseamCm: z.number().min(50).max(120),
    torsoCm: z.number().min(40).max(90),
    armCm: z.number().min(40).max(90),
    heightCm: z.number().min(120).max(230),
    flexibilityScore: z.number().min(1).max(10),
    discipline: z.enum(["road", "gravel", "mtb", "triathlon"])
  })
});

const frameOptionsSchema = bikeCreateSchema.shape.frameOptions;

export async function createServer(config: AppConfig = getConfig()): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  await app.register(cors, {
    origin: [config.CORS_ORIGIN],
    credentials: true
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  await app.register(jwt, { secret: config.JWT_SECRET });

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/v1/tenants/bootstrap", async (request, reply) => {
    const payload = tenantBootstrapSchema.parse(request.body);
    const rawApiKey = `bkf_${randomBytes(24).toString("hex")}`;
    const passwordHash = await hashPassword(payload.admin.password);

    const result = await prisma.$transaction(async (trx) => {
      const tenant = await trx.tenant.create({
        data: {
          slug: payload.slug,
          displayName: payload.displayName
        }
      });

      const user = await trx.user.create({
        data: {
          email: payload.admin.email.toLowerCase(),
          fullName: payload.admin.fullName,
          passwordHash
        }
      });

      await trx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "owner"
        }
      });

      await trx.apiKey.create({
        data: {
          tenantId: tenant.id,
          label: "default-embed-key",
          keyHash: hashApiKey(rawApiKey)
        }
      });

      return { tenantId: tenant.id, userId: user.id };
    });

    reply.code(201).send({
      ...result,
      embedApiKey: rawApiKey
    });
  });

  app.post("/v1/auth/token", async (request, reply) => {
    const payload = tokenSchema.parse(request.body);
    const membership = await prisma.membership.findFirst({
      where: {
        tenant: { slug: payload.tenantSlug },
        user: { email: payload.email.toLowerCase() }
      },
      include: {
        user: true,
        tenant: true
      }
    });

    if (!membership) {
      reply.code(401).send({ error: "Invalid credentials" });
      return;
    }

    const valid = await verifyPassword(payload.password, membership.user.passwordHash);
    if (!valid) {
      reply.code(401).send({ error: "Invalid credentials" });
      return;
    }

    const token = await reply.jwtSign(
      {
        userId: membership.userId,
        tenantId: membership.tenantId,
        role: membership.role
      },
      { expiresIn: "10h" }
    );

    reply.send({
      token,
      tenantId: membership.tenantId,
      role: membership.role,
      tenantName: membership.tenant.displayName
    });
  });

  app.get("/v1/bikes", { preHandler: requireTenantAuth }, async (request) => {
    return prisma.bikeModel.findMany({
      where: {
        tenantId: request.authTenantId
      },
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/v1/bikes", { preHandler: requireTenantAuth }, async (request, reply) => {
    const payload = bikeCreateSchema.parse(request.body);
    const bike = await prisma.bikeModel.create({
      data: {
        tenantId: request.authTenantId!,
        modelName: payload.modelName,
        discipline: payload.discipline,
        geometryJson: payload.geometry,
        frameOptions: payload.frameOptions
      }
    });

    reply.code(201).send(bike);
  });

  app.post("/v1/sizing/predict", { preHandler: requireTenantAuth }, async (request, reply) => {
    const payload = sizingSchema.parse(request.body);
    const bike = await prisma.bikeModel.findFirst({
      where: {
        id: payload.bikeModelId,
        tenantId: request.authTenantId
      }
    });

    if (!bike) {
      reply.code(404).send({ error: "Bike model not found" });
      return;
    }

    const frameOptions = frameOptionsSchema.parse(bike.frameOptions);
    const recommendation = recommendBikeSize(payload.riderProfile, frameOptions);

    await prisma.fitSession.create({
      data: {
        tenantId: request.authTenantId!,
        bikeModelId: bike.id,
        riderProfileJson: payload.riderProfile as Prisma.InputJsonValue,
        recommendationJson: recommendation as unknown as Prisma.InputJsonValue,
        source: "dashboard"
      }
    });

    reply.send(recommendation);
  });

  app.get("/v1/fit-sessions", { preHandler: requireTenantAuth }, async (request) => {
    return prisma.fitSession.findMany({
      where: { tenantId: request.authTenantId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  });

  app.post("/v1/embed/sessions", { preHandler: requireEmbedApiKey }, async (request, reply) => {
    const payload = sizingSchema.parse(request.body);
    const bike = await prisma.bikeModel.findFirst({
      where: {
        id: payload.bikeModelId,
        tenantId: request.authTenantId
      }
    });

    if (!bike) {
      reply.code(404).send({ error: "Bike model not found" });
      return;
    }

    const frameOptions = frameOptionsSchema.parse(bike.frameOptions);
    const recommendation = recommendBikeSize(payload.riderProfile, frameOptions);
    const embedToken = await reply.jwtSign(
      {
        tenantId: request.authTenantId!,
        bikeModelId: bike.id
      },
      { expiresIn: "15m" }
    );

    await prisma.fitSession.create({
      data: {
        tenantId: request.authTenantId!,
        bikeModelId: bike.id,
        riderProfileJson: payload.riderProfile as Prisma.InputJsonValue,
        recommendationJson: recommendation as unknown as Prisma.InputJsonValue,
        source: "embed"
      }
    });

    reply.send({ embedToken, recommendation });
  });

  return app;
}
