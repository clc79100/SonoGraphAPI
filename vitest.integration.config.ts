import { defineConfig } from 'vitest/config';

// Config separada para integración/container tests (requieren Docker).
// No corre con `npm test` (unitarias); se ejecuta con `npm run test:int`.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.int-spec.ts'],
    testTimeout: 120000,
    hookTimeout: 180000,
    // Contenedores: ejecutar los archivos en serie para no saturar Docker.
    fileParallelism: false,
  },
});
