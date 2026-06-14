import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret-test-secret-0123456789',
      CORS_ORIGINS: '*',
    },
    pool: 'forks',
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
