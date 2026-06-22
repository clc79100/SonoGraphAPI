import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      // Capa de dominio bajo prueba en esta iteración: mappers puros (objetivo 90%).
      include: ['src/proxy/*.mappers.ts'],
      // Dominio: lines/statements/functions ≥90 (reales 100%). Branches a 75 porque las
      // ramas restantes son guardas defensivas `?? []` que los services nunca disparan.
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 75 },
    },
  },
});
