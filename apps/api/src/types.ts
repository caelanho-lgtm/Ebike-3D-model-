import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authTenantId?: string;
    authUserId?: string;
    authRole?: string;
  }
}
