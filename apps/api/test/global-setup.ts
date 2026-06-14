import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

/** Provision a fresh SQLite schema for the API integration tests. */
export default function setup() {
  const DATABASE_URL = 'file:./test.db';
  try {
    rmSync('./prisma/test.db', { force: true });
    rmSync('./test.db', { force: true });
  } catch {
    /* ignore */
  }
  execSync('npx prisma db push --force-reset --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
  });
}
