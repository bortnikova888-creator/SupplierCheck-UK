import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@pkg/core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@pkg/config': resolve(__dirname, '../packages/config/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
