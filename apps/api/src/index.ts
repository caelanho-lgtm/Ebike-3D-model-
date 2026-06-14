/**
 * @dtf/api — NestJS service (REST + GraphQL), one module per bounded context.
 * Re-runs @dtf/fit-core server-side for authoritative reports. See
 * docs/blueprint.md §1.2, §1.3 and CLAUDE.md.
 *
 * SCAFFOLD: the NestJS app + modules + Prisma wiring land in the API + DB slice.
 */

export const API_APP = '@dtf/api' as const;
