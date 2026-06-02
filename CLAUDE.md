# Sonograph — Infraestructura y arquitectura backend

## Visión general

```
Vercel (Frontend)
     │
     ▼
AWS Elastic Beanstalk (NestJS API)
     │              │
     ▼              ▼
Supabase        Upstash Redis
(PostgreSQL)    (Auth / caché)
     │
     ▼
APIs externas: MusicBrainz · Spotify · Last.fm · TheAudioDB
```

---

## Frontend

- **Stack**: Vite + React 18 + TypeScript (ya existente)
- **Deploy**: Vercel (import directo del repo, sin configuración extra)
- **Variable de entorno**: solo `VITE_API_URL` apuntando al backend en AWS
- Los libs de `src/lib/` (musicbrainz, spotify, lastfm, audiodb) se reemplazan por calls al backend propio — los tipos `Unified*` y todos los componentes de UI no cambian

---

## Base de datos relacional — PostgreSQL (Supabase)

- Proyecto en Supabase, región `us-east-2` (misma que el backend en AWS)
- 10 tablas según el schema en `sonograph_schema.sql`
- La API conecta vía **connection string** de Supabase con el driver de Postgres (`pg` o TypeORM)
- No se usa el cliente JS de Supabase — toda la comunicación pasa por NestJS
- Los géneros y familias se cargan al arrancar la API y se mantienen en memoria/caché

### Row Level Security (RLS)

Aunque la API es el único cliente *previsto*, Supabase expone **automáticamente** una API REST (PostgREST) sobre el schema `public`, accesible con la **anon key** (que es pública). Sin RLS, cualquiera con esa key podría leer/escribir las tablas directamente (incluido `users.password_hash`), saltándose NestJS. Por eso:

- **RLS está habilitado en todas las tablas de `public`** (migración `EnableRls`), **sin políticas** → PostgREST/anon queda en "deny-all".
- La API **no se ve afectada** porque conecta como el rol **`postgres`**, que es *owner* de las tablas y tiene `BYPASSRLS = true` → ignora RLS por completo.
- **No se escriben políticas RLS**: toda la autorización vive en NestJS (JWT + guards). Las tablas no necesitan reglas por-fila en Postgres.
- Si en el futuro se crea una tabla nueva, hay que acordarse de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (o el advisor `0013_rls_disabled_in_public` volverá a marcar ERROR).

**Tablas**:
1. `families` — agrupaciones de géneros
2. `genres` — self-referencial con `parent_id`
3. `genre_relations` — afinidad many-to-many entre géneros
4. `genre_source_tags` — mapeo genre → tag por fuente (MB/Spotify/LFM)
5. `users` — auth básica
6. `favorite_genres`
7. `favorite_artists`
8. `favorite_tracks`
9. `favorite_albums`
10. `genre_visits` — historial de nodos visitados en el grafo

---

## Base de datos no relacional — Redis (Upstash)

- **Proveedor**: Upstash (serverless Redis, free tier: 10K commands/day)
- Conecta desde NestJS vía `@upstash/redis` o `ioredis` con la URL de Upstash
- No requiere gestión de infraestructura ni VPC

**Dos usos**:

### Auth
- `refresh_token:{userId}` → refresh JWT, TTL 7 días
- `blacklist:{jti}` → access tokens revocados en logout, TTL igual al tiempo restante del token (~15min)

### Caché de respuestas de APIs externas
- `artists:search:{source}:{query}` → TTL 1h
- `artists:detail:{source}:{id}` → TTL 24h
- `artists:albums:{source}:{id}` → TTL 24h
- `artists:tracks:{source}:{id}` → TTL 24h
- `artists:image:{id}` → TTL 7 días
- `genres:all` → TTL indefinido (invalidar manualmente al editar la BD)
- `spotify:token` → TTL 55min (el token de Spotify expira a los 60)

---

## Backend — NestJS

- **Runtime**: Node.js 25, NestJS 10
- **Deploy**: AWS Elastic Beanstalk (plataforma Node.js, región `us-east-1`)
- **ORM**: TypeORM con entidades para las 10 tablas de Postgres
- **Auth**: JWT con access token (15min) + refresh token (7 días) gestionado en Redis

### Módulos principales

```
src/
├── auth/           # Login, registro, refresh, logout, guards JWT
├── genres/         # CRUD de géneros y familias, query de visitas
├── artists/        # Proxy unificado: search, detail, albums, tracks, image
├── proxy/          # Services internos: mb, spotify, lastfm, audiodb
├── cache/          # Interceptor Redis para cachear respuestas del proxy
└── config/         # Variables de entorno (API keys nunca en el frontend)
```

### Variables de entorno en Elastic Beanstalk

```
DATABASE_URL           # Connection string de Supabase
REDIS_URL              # URL de Upstash
JWT_SECRET
JWT_REFRESH_SECRET
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
LASTFM_API_KEY
# MusicBrainz no requiere key, solo User-Agent
```

### Endpoints principales

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /genres                         # todos los géneros (para el grafo)
GET    /genres/:id
GET    /families
GET    /genres/:id/artists?source=&limit=
GET    /genres/:id/tracks?source=&limit=

GET    /api/search/artists?q=&source=&limit=
GET    /api/artists/:id?source=
GET    /api/artists/:id/albums?source=&limit=
GET    /api/artists/:id/tracks?source=&limit=
GET    /api/artists/:id/image?source=

GET    /users/me/favorites/genres
POST   /users/me/favorites/genres/:genreId
DELETE /users/me/favorites/genres/:genreId

GET    /users/me/favorites/artists
POST   /users/me/favorites/artists
DELETE /users/me/favorites/artists/:id

GET    /users/me/favorites/tracks
POST   /users/me/favorites/tracks
DELETE /users/me/favorites/tracks/:id

GET    /users/me/favorites/albums
POST   /users/me/favorites/albums
DELETE /users/me/favorites/albums/:id

POST   /users/me/genre-visits/:genreId
GET    /users/me/genre-visits/recent
GET    /users/me/genre-visits/top
```

### Consideraciones por fuente externa

- **MusicBrainz**: rate limit ~1 req/s → serializar con una cola (`@nestjs/bull`) o throttle por IP. Header `User-Agent: Sonograph/1.0`
- **Spotify**: cuenta Premium — Client Credentials (`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`). Token se renueva automáticamente (`expires_in - 60s`) → cacheado en Redis bajo `spotify:token`
- **Last.fm**: filtrar imagen placeholder `2a96cbd8b46e442fc41c2b86b821562f` → devolver `null`
- **AudioDB**: key pública `123`, fuente primaria de imágenes para MB y LFM

### Estrategia de imagen de artista

```
AudioDB por MBID
  → AudioDB por nombre
    → imagen de la fuente original (Wikipedia para MB, LFM para Last.fm)
      → null

Spotify usa su propia imagen directamente, sin pasar por AudioDB
```

---

## Notas para Claude Code

- El schema SQL completo está en `sonograph_schema.sql`
- El contexto del frontend y los tipos `Unified*` están en el `CLAUDE.md` original del proyecto
- No modificar los tipos `UnifiedArtist`, `UnifiedAlbum`, `UnifiedTrack`, `SearchArtist` — el frontend depende de ellos
- La migración del frontend es quirúrgica: solo cambian los archivos en `src/lib/`, no los componentes

---

## Observabilidad — Winston + Azure Application Insights

```
NestJS (AWS Elastic Beanstalk)
        │
        ├── Winston Logger (JSON estructurado)
        │       │
        │       ├── ConsoleTransport (desarrollo local)
        │       └── AzureApplicationInsightsTransport (producción)
        │
        └── Application Insights SDK (auto-instrumentación)
                │
                ▼
        Azure Application Insights
                │
                ├── Log Analytics Workspace (Kusto queries)
                ├── Live Metrics (tiempo real)
                ├── Application Map (dependencias)
                └── Failures (errores con stack trace)
```

### Paquetes

```
winston
nest-winston
winston-azure-application-insights
applicationinsights
```

### Estructura de módulos

```
src/core/logger/
├── logger.module.ts        # @Global(), configura Winston, exporta WinstonModule
├── http-logger.middleware.ts  # Log de cada request/response
└── all-exceptions.filter.ts   # Global exception filter (catch-all)
```

### Transports por entorno

| `NODE_ENV` | Transports |
| --- | --- |
| `development` | Console colorizado (human-readable) |
| `production` | Console JSON + ApplicationInsightsTransport |
| `test` | Silent |

### Formato de cada log (JSON)

```json
{
  "timestamp": "2026-06-01T14:32:11.452Z",
  "level": "info",
  "message": "GET /api/artists/123456 → 200 (341ms)",
  "context": "ArtistsController",
  "meta": {
    "method": "GET",
    "path": "/api/artists/123456",
    "statusCode": 200,
    "durationMs": 341,
    "userId": "uuid-del-usuario",
    "source": "spotify",
    "cacheHit": false
  }
}
```

### Eventos instrumentados

| Servicio | Evento | Level | Campos extra |
| --- | --- | --- | --- |
| HTTP middleware | Cada request | `info` | `method`, `path`, `statusCode`, `durationMs`, `userId` |
| `AuthService` | Login exitoso | `info` | `userId` |
| `AuthService` | Login fallido | `warn` | `reason` |
| `AuthService` | Register | `info` | `userId` |
| `AuthService` | Refresh token | `info` | `userId` |
| `AuthService` | Reuse de refresh | `warn` | `userId` |
| `AuthService` | Logout | `info` | `userId` |
| `JwtStrategy` | Token revocado | `warn` | `jti` |
| `CacheService` | Cache hit | `info` | `key` |
| `CacheService` | Cache miss | `info` | `key` |
| `ProxyExceptionFilter` | Error proxy | `error` | `code`, `status` |
| `MusicbrainzService` | Respuesta no-OK | `warn` | `status`, `path` |
| `MusicbrainzService` | Rate limit (503) | `warn` | `retryAfterMs` |
| `SpotifyService` | Request fallido | `error` | `status`, `path` |
| `VisitsService` | Genre visitado | `info` | `userId`, `genreId` |
| `FavoritesService` | Favorito añadido | `info` | `userId`, tipo, id |
| `FavoritesService` | Favorito eliminado | `info` | `userId`, tipo, id |
| `GenresService` | Grafo cargado | `info` | — |
| `AllExceptionsFilter` | Error no manejado | `error` | `stack`, `statusCode`, `path` |

### Variables de entorno adicionales

```
APPLICATIONINSIGHTS_CONNECTION_STRING   # Azure Portal → App Insights → Connection String
```

Agregar en Elastic Beanstalk: Configuration → Software → Environment properties.

### Inicialización en main.ts (orden crítico)

App Insights **debe** inicializarse antes de `NestFactory.create` — el SDK parchea `http`, `https`, `pg` e `ioredis` a nivel de módulo:

```typescript
// 1. App Insights PRIMERO
if (NODE_ENV === 'production' && APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(connectionString)
    .setAutoCollectRequests(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectExceptions(false)   // AllExceptionsFilter es la fuente de verdad
    .setAutoCollectConsole(false)      // Winston transport maneja esto
    .start();
}

// 2. NestJS con bufferLogs: true
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
app.useGlobalFilters(app.get(AllExceptionsFilter));
```

`setAutoCollectExceptions(false)` es **intencional** — evita doble conteo de errores ya enviados por `AllExceptionsFilter` vía el Winston transport.

### Sampling para /genres

`GET /genres` se llama mucho y siempre es exitoso. Se aplica 20% de sampling vía `TelemetryProcessor` en App Insights para no consumir el free tier:

```typescript
appInsights.defaultClient.addTelemetryProcessor((envelope) => {
  const name = (envelope.data as any)?.baseData?.name ?? '';
  if (name.includes('/genres') && Math.random() > 0.2) return false;
  return true;
});
```

### Free tier de Azure Application Insights

- **5 GB / mes** de datos ingestados — gratuitos
- Retención: 90 días
- Si se supera: ~$2.30 por GB adicional
- Optimización: no loguear bodies de response, no loguear queries SQL exitosas, sampling en `/genres`

### KQL queries útiles

```kql
// Auth failures
traces
| where customDimensions.context == "AuthService"
| where severityLevel >= 2
| order by timestamp desc

// Errores de APIs externas
dependencies
| where success == false
| summarize count() by target, resultCode
| order by count_ desc

// Cache hit rate
traces
| where customDimensions.cacheHit != ""
| summarize
    hits=countif(customDimensions.cacheHit == "true"),
    misses=countif(customDimensions.cacheHit == "false")
    by bin(timestamp, 1h)
| extend hitRate = hits * 100.0 / (hits + misses)
| render timechart

// Errores no manejados
traces
| where severityLevel >= 3
| order by timestamp desc
| project timestamp, message, customDimensions
```

### Inyección del logger

Siempre usar `@Inject(WINSTON_MODULE_NEST_PROVIDER)` con tipo `LoggerService` de `@nestjs/common`. `LoggerModule` es `@Global()` — los demás módulos no necesitan importarlo explícitamente.
