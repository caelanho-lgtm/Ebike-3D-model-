import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { prisma } from "./db.js";

export interface JwtClaims {
  userId: string;
  tenantId: string;
  role: string;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function requireTenantAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const claims = await request.jwtVerify<JwtClaims>();
    request.authTenantId = claims.tenantId;
    request.authUserId = claims.userId;
    request.authRole = claims.role;
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export async function requireEmbedApiKey(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawKey = request.headers["x-embed-api-key"];
  if (!rawKey || typeof rawKey !== "string") {
    reply.code(401).send({ error: "Missing embed API key" });
    return;
  }

  const keyHash = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null
    }
  });

  if (!apiKey) {
    reply.code(401).send({ error: "Invalid embed API key" });
    return;
  }

  request.authTenantId = apiKey.tenantId;
}
