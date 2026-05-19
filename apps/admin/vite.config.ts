import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // When served behind nginx at /admin, assets need the correct base path.
  // VITE_BASE_URL defaults to /admin in production docker, / in dev.
  base: process.env.VITE_BASE_URL ?? '/',
  resolve: {
    alias: {
      '@longevity/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
