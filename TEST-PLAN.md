# SonoGraph API — Plan y registro de pruebas

Documento específico de la **API** (`SonoGraphAPI`). Aquí se documenta todo lo relativo a
pruebas del backend: **unitarias**, **integración (Supertest)**, **container tests
(Testcontainers: Postgres + Redis)**, seguridad y rendimiento. El plan global de calidad
(13 puntos, estrategia por capa, criterios, riesgos) vive en `../TEST-PLAN.md`.

| Metadato | Valor |
|---|---|
| Componente | `SonoGraphAPI` (NestJS 10 + TypeScript) |
| Runner | **Vitest 4** (`vitest run`) |
| Cobertura | provider `v8` |
| Fecha | 2026-06-21 |
| Estado | Unitarias ✅ · Integración ✅ · Container (PG+Redis) ✅ · Seguridad ✅ · Rendimiento ✅ |

---

## 1. Configuración del entorno de pruebas

**Dependencias añadidas:** `vitest`, `@vitest/coverage-v8`.

**Scripts (`package.json`):**

| Comando | Acción |
|---|---|
| `npm run test` | Ejecuta todos los specs una vez (`vitest run`) |
| `npm run test:watch` | Modo watch |
| `npm run test:cov` | Tests + reporte de cobertura + gate de umbrales |
| `npm run test:int` | Integración + container tests (Testcontainers; **requiere Docker**) |

**`vitest.config.ts`:** entorno `node`, `globals: true`, incluye `src/**/*.spec.ts`.
Cobertura enfocada en la **capa de dominio** bajo prueba (mappers puros) con umbrales:

```
lines 90 · statements 90 · functions 90 · branches 75
```

> Config TypeScript estricta ya aplicada (`strict`, `noUnusedLocals/Params`,
> `no-explicit-any: 'warn'`) — ver `../TEST-PLAN.md` §14.

**Config de TS para tests (importante):** `tsconfig.json` usa `rootDir: "./src"` e
`include: ["src/**/*"]` para que `nest build` (vía `tsconfig.build.json`, que excluye
`test` y `*spec.ts`) emita en `dist/main.js` (no `dist/src/main.js`). Los archivos de
`test/` se tipan con **`tsconfig.spec.json`** (`rootDir: "."`, `noEmit`), referenciado por
ESLint (`project: ['tsconfig.json', 'tsconfig.spec.json']`). Vitest usa esbuild, ajeno a
estos `tsconfig`.

---

## 2. Pruebas unitarias ✅ (Checklist §3)

### 2.1 Qué se prueba

Funciones **puras** de lógica de negocio (normalización/transformación), aisladas y sin
HTTP/BD. Para poder testearlas, los mappers que estaban embebidos en los proxy services se
**extrajeron** a módulos puros:

| Módulo nuevo (puro) | Origen | Funciones |
|---|---|---|
| `src/proxy/lastfm.mappers.ts` | `lastfm.service.ts` | `idToParam`, `pickImage`, `mapSearchArtists`, `mapArtist`, `mapAlbums`, `mapTracks`, `mapArtistsByTag`, `mapTracksByTag` |
| `src/proxy/musicbrainz.mappers.ts` | `musicbrainz.service.ts` | `coverArtUrl`, `mapSearchArtists`, `mapArtist`, `mapAlbums`, `mapTracks`, `mapTracksByTag` |
| `src/proxy/spotify.mappers.ts` | `spotify.service.ts` | `mapSearchArtists`, `mapArtist`, `mapAlbums`, `mapTracks`, `mapTracksByGenre` |

Los services ahora **delegan** en estos mappers (comportamiento idéntico, verificado con
`tsc` y `nest build` → 0 errores).

### 2.2 Specs

| Spec | Casos | Reglas de negocio clave verificadas |
|---|---|---|
| `lastfm.mappers.spec.ts` | 16 | `name:`/`mbid` en `idToParam`; **filtro del placeholder** `2a96cbd8…` y prioridad de tamaños en `pickImage`; id compuesto `name:<artista>\|<álbum>`; duración seg→ms |
| `musicbrainz.mappers.spec.ts` | 13 | URL CoverArtArchive (250/500); **dedup de genres+tags en minúsculas**; orden de álbumes por año; `artist-credit[0].name` |
| `spotify.mappers.spec.ts` | 10 | `source: 'spotify'`; primera imagen / `image: null`; año desde `release_date`; `duration_ms` |

### 2.3 Buenas prácticas aplicadas (PDF §3.2)

- **AAA** explícito (`// Arrange / Act / Assert`) en cada test.
- **Nombres descriptivos** anidados (`describe` módulo → `describe` función → `it` caso).
- **Una aserción / un concepto** por test.
- **Sin `if`/`else` ni bucles** dentro de los tests.
- **Tests independientes** (sin estado compartido ni orden).

### 2.4 Resultado de ejecución

```
Test Files  3 passed (3)
Tests       39 passed (39)

% Coverage (src/proxy/*.mappers.ts)
Statements : 100% (54/54)
Functions  : 100% (37/37)
Lines      : 100% (32/32)
Branches   :  78.02% (71/91)   ← gate 75 (ramas restantes = guardas `?? []` defensivas)
```

✅ Cumple el objetivo de **cobertura de dominio ≥90%** en statements/functions/lines.

### 2.5 Casos de prueba (referencia)

| ID | Caso | Esperado |
|---|---|---|
| `TC-UNIT-001` | `pickImage` con solo placeholder | `null` |
| `TC-UNIT-002` | `idToParam('name:Radiohead')` | `{ artist: 'Radiohead' }` |
| `TC-UNIT-003` | `mapTracks` duración `'238'` (s) | `238000` (ms) |
| `TC-UNIT-004` | `mapArtist` (MB) genres+tags duplicados | minúsculas sin duplicados |
| `TC-UNIT-005` | `mapAlbums` (MB) varios años | ordenados ascendente |

---

## 3. Pruebas de integración ✅ (Checklist §4.1)

**Herramienta:** Supertest sobre la app NestJS real (`Test.createTestingModule(AppModule)`
+ `createNestApplication`, con el mismo `ValidationPipe` que `main.ts`). La app se conecta
a los **contenedores efímeros** de Postgres y Redis (no Supabase/Upstash).

**Setup (`test/api.int-spec.ts` → `beforeAll`):** (1) arranca Postgres y Redis con
Testcontainers; (2) fija `process.env` **antes** de importar la app (porque `envs` se lee
al importar) → los imports de la app son **dinámicos**; (3) corre migraciones; (4) arranca
la app. `afterEach` hace `TRUNCATE` de las tablas de usuario para aislamiento.

| ID | Caso | Resultado |
|---|---|---|
| `TC-API-001` | `GET /genres` (happy path) | `200` + array |
| `TC-API-002` | `POST /auth/register` sin campos | `400` (ValidationPipe) |
| `TC-API-003` | `GET /users/me/favorites/genres` sin token | `401` |
| `TC-API-004` | `GET /genres/no-existe` | `404` |
| `TC-API-005` | `POST /auth/register` email duplicado | `409` |

## 4. Container tests ✅ (Checklist §4.2 PostgreSQL / §4.3 Redis)

**PostgreSQL — `test/api.int-spec.ts` + `test/test-data-source.ts`:**

1. **Testcontainers** levanta `postgres:16-alpine` efímero por corrida.
2. **Migraciones reales de TypeORM** (las 4: `InitSchema`, `GenreMultiParent`,
   `AddCheckConstraints`, `EnableRls`) se ejecutan antes de los tests vía un `DataSource`
   de test que importa las clases de migración (en tests no hay bundle `dist/`).
3. **Aislamiento** con `TRUNCATE ... RESTART IDENTITY CASCADE` en `afterEach`.
   - Verificado: el esquema existe (tabla `users` consultable) y queda vacío entre tests.
   - Para tests se desactiva SSL (`data-source.ts`: `ssl: NODE_ENV==='test' ? false : …`).

**Redis — `test/redis.int-spec.ts`:** `redis:7-alpine` efímero (ioredis).

| Caso | Verifica |
|---|---|
| set / get | el valor almacenado se recupera |
| expire (TTL `PX 50`) | la clave expira y devuelve `null` |
| invalidación (`del`) | la clave se elimina |
| `flushdb` en `afterEach` | aislamiento: la BD queda vacía |

**Ejecución:** `npm run test:int` → **2 archivos, 11 tests pasan** (5 API + 2 PostgreSQL +
4 Redis). Config separada en `vitest.integration.config.ts` (no corre con `npm test`).

## 5. Seguridad ✅ (Checklist §7) — implementado

### Resumen OWASP Top 10 (mínimo 3 cubiertos)

| OWASP | Control | Implementación |
|---|---|---|
| **A02 — Cryptographic Failures** | bcrypt(12) para passwords | `auth.service.ts` — `bcrypt.hash(password, 12)` |
| **A03 — Injection** | TypeORM parametrizado en todos los queries | Sin SQL crudo con input de usuario |
| **A05 — Security Misconfiguration** | Helmet con headers de seguridad (`CSP`, `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, etc.) | `helmet()` en `main.ts:39` |
| **A07 — Identification & Auth Failures** | JWT exp 15min + refresh rotado/revocado en Redis + rate-limit en login | `AuthService` (`issueTokens`) + `@Throttle({ limit: 5, ttl: 60s })` en login |

### Gaps detectados y corrección

| Gap | Riesgo | Corrección aplicada |
|---|---|---|
| **Falta `helmet`** | Sin headers de seguridad (CSP, X-Frame-Options, HSTS, X-Content-Type-Options) | `app.use(helmet())` en `main.ts` |
| **Falta rate-limit en login** | Brute-force sobre credenciales sin límite de intentos | `@nestjs/throttler` con 5 intentos/min en `POST /auth/login` y 30 req/min global |

## 6. Rendimiento ✅ (Checklist §6) — implementado

**Herramienta:** k6 v2.0.0. **Scripts:** `perf/*.ts` (TypeScript, transpilación nativa vía esbuild).

| Script | Tipo | Escenario | Umbrales |
|---|---|---|---|
| `perf/load.ts` | Load | Ramp-up 5m → 50VUs × 10m → ramp-down | p95 < 3000ms, errors < 1% |
| `perf/stress.ts` | Stress | Escalera 2m c/u: 50 → 100 → 150 → 200 → 250 → 300 VUs | p95 < 3000ms, errors < 1% |
| `perf/spike.ts` | Spike | Warmup 1m → 10s a 500VUs → hold 1m → down 30s | p95 < 3000ms, errors < 1% |
| `perf/soak.ts` | Soak | Ramp-up 5m → 50VUs × 2h → ramp-down | p95 < 3000ms, errors < 1% |

Config común (`perf/shared.ts`): `BASE_URL` (env `BASE_URL` → `http://localhost:3000`), thresholds, `summaryTrendStats`.

**Ejecución:**
```bash
npm run perf:load     # ~15 min
npm run perf:stress   # ~12 min
npm run perf:spike    # ~3 min
npm run perf:soak     # ~2h 5min
npm run perf:all      # load + stress + spike
```

> El Soak (2h) no se incluye en `perf:all` por su duración y consumo de Redis.
> Ver detalles en `../TEST-PLAN.md` §3.4.

---

## Cómo ejecutar

```bash
npm install
npm run test:cov     # unitarias + cobertura
npm run build        # typecheck estricto
npm run lint         # eslint + prettier
```
