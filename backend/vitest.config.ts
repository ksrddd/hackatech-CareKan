import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    setupFiles: [],
    fileParallelism: false, // tests share one Postgres test DB
    hookTimeout: 30000,
  },
});
