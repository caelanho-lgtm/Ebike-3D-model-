/**
 * @dtf/db — Prisma schema, migrations, and Postgres RLS policies. Tenants,
 * riders, bikes, fit sessions. See CLAUDE.md (multi-tenant: RLS, not app-layer
 * filtering alone) and docs/blueprint.md §1.2.
 *
 * SCAFFOLD: the Prisma schema + generated client arrive in the API + DB slice.
 */

export const DB_PACKAGE = '@dtf/db' as const;
