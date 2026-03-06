import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@mind': path.resolve(__dirname, 'src/mind'),
      '@agent': path.resolve(__dirname, 'src/agent'),
      '@optimizer': path.resolve(__dirname, 'src/optimizer'),
      '@weaver': path.resolve(__dirname, 'src/weaver'),
    },
  },
  test: {
    globals: true,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
  },
});
