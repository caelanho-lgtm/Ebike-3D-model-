import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "./server.js";

let app: Awaited<ReturnType<typeof createServer>>;

beforeAll(async () => {
  process.env.DATABASE_URL ??= "postgresql://bikefit:bikefit@localhost:5432/bikefit?schema=public";
  process.env.JWT_SECRET ??= "unit-test-jwt-secret-that-is-long-enough";
  process.env.CORS_ORIGIN ??= "https://example.com";
  app = await createServer({
    NODE_ENV: "test",
    PORT: 0,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
});

afterAll(async () => {
  await app.close();
});

describe("health endpoint", () => {
  it("returns healthy response", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
