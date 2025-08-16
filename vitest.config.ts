import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: [
      'test/unit/**/*.{test,spec}.ts?(x)',
      'src/**/*.{test,spec}.ts?(x)',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'prisma',
      'test/e2e/**',
      'tests/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'test/',
        'tests/',
        '**/*.config.*',
        '**/*.setup.*',
        'src/types/',
        'src/app/api/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'node20',
  },
});
