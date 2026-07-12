import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    setupFiles: ['src/test/setup.ts'],
    fileParallelism: false, // tests share one Postgres test DB
    hookTimeout: 90000,
  },
  plugins: [
    // esbuild ไม่ emit decorator metadata ที่ Nest DI ต้องใช้ — แปลงด้วย SWC แทน
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
});
