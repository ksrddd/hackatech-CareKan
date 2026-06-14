import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(here, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // shared/types.ts lives one level above frontend/ — explicitly allow.
    fs: { allow: [resolve(here, '..')] },
  },
});
