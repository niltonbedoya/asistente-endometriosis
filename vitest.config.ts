import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Deterministic, offline-by-default: no network, no timers flakiness
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
