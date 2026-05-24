# SonoGraph API

Backend NestJS de Sonograph: grafo de géneros musicales, auth con JWT + Redis, favoritos e historial de visitas. Conecta a PostgreSQL (Supabase) vía TypeORM y a Redis para tokens.

## Stack

- **NestJS 10** + **TypeScript** (Node.js 25)
- **TypeORM 0.3** + driver `pg` → PostgreSQL en Supabase
- **ioredis** → Redis (auth: refresh tokens + blacklist de access tokens)
- **JWT** (`@nestjs/jwt` + `passport-jwt`): access 15min, refresh 7 días
- Config de entorno con `dotenv` + `env-var` (`src/config/envs.ts`)

## Requisitos

- Node.js 25 (`nvm use 25`)
- Redis local en `localhost:6379` (o vía Docker, ver abajo)
- Una base PostgreSQL en Supabase

## Configuración

1. Crear `.env` a partir del ejemplo y rellenar credenciales:

   ```bash
   cp .env.example .env
   ```

   Variables:

   | Variable | Descripción |
   |---|---|
   | `PORT` | Puerto HTTP (default 3000) |
   | `NODE_ENV` | `development` / `production` |
   | `CORS_ORIGIN` | Origen permitido (frontend), separado por comas |
   | `DATABASE_URL` | Connection string del **pooler** de Supabase (puerto 6543) — usado en runtime |
   | `DIRECT_URL` | Connection string **directa** de Supabase (puerto 5432) — usado por las migraciones |
   | `REDIS_HOST` / `REDIS_PORT` | Host y puerto de Redis |
   | `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secretos de firma JWT |
   | `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | TTL en segundos (900 / 604800) |

2. Instalar dependencias:

   ```bash
   npm install
   ```

## Comandos

### Desarrollo

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo watch (puerto 3000) |
| `npm run start` | Servidor sin watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main.js` |
| `npm run lint` | ESLint con `--fix` |
| `npm run format` | Prettier sobre `src/` |

### Migraciones (TypeORM)

Las migraciones usan `DIRECT_URL` (conexión directa, puerto 5432). El data-source vive en `src/core/db/data-source.ts` y las migraciones en `src/core/db/migrations/`.

| Comando | Descripción |
|---|---|
| `npm run migration:generate -- src/core/db/migrations/<Nombre>` | Genera una migración diffeando las entidades contra la BD |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:revert` | Revierte la última migración aplicada |

> Cada comando hace `npm run build` primero y corre la CLI sobre `dist/core/db/data-source.js`.

Ejemplo (migración inicial — ya aplicada):

```bash
npm run migration:generate -- src/core/db/migrations/InitSchema
npm run migration:run
```

Migraciones aplicadas:
- `InitSchema` — crea las tablas base: `families`, `genres`, `genre_relations`, `genre_source_tags`, `users`, `favorite_genres`, `favorite_artists`, `favorite_tracks`, `favorite_albums`, `genre_visits`.
- `GenreMultiParent` — reemplaza `genres.parent_id` (padre único) por la tabla `genre_parents` (many-to-many): un género puede tener varios padres.

### Seed de familias y géneros

Carga las 17 familias y ~496 géneros (con jerarquía `genre_parents` y afinidades `genre_relations`) desde el dataset curado del frontend, copiado en `src/core/db/seed-data/genres.ts`. Es idempotente (upsert por id), así que se puede correr varias veces.

```bash
npm run seed
```

## Docker

`example.compose.yml` levanta la API + Redis (Postgres vive en Supabase, no en compose):

```bash
docker compose -f example.compose.yml up --build        # API + Redis
docker compose -f example.compose.yml up redis           # solo Redis (para dev local)
```

## Endpoints

Base: `http://localhost:3000`

### Auth
- `POST /auth/register` — `{ email, password }` → `{ user, accessToken, refreshToken }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/refresh` — `{ refreshToken }` (rotación)
- `POST /auth/logout` — `Bearer access` → 204

### Genres
- `GET /families`
- `GET /genres`
- `GET /genres/:id`

### Favorites (requieren `Bearer access`)
- `GET|POST|DELETE /users/me/favorites/genres[/:genreId]`
- `GET|POST /users/me/favorites/artists` · `DELETE /users/me/favorites/artists/:id`
- `GET|POST /users/me/favorites/tracks` · `DELETE /users/me/favorites/tracks/:id`
- `GET|POST /users/me/favorites/albums` · `DELETE /users/me/favorites/albums/:id`

### Genre visits (requieren `Bearer access`)
- `POST /users/me/genre-visits/:genreId`
- `GET /users/me/genre-visits/recent?limit=10`
- `GET /users/me/genre-visits/top?limit=10`

### Proxy de fuentes externas (`/api`)

El backend hace de intermediario hacia MusicBrainz, Spotify, Last.fm y TheAudioDB: oculta las API keys, cachea en Redis (búsquedas 1h, detalle/álbumes/tracks 24h, imágenes 7d, token de Spotify ~55min) y normaliza todo a los tipos `Unified*`. El parámetro `source` es obligatorio: `musicbrainz` | `spotify` | `lastfm`.

- `GET /api/search/artists?q=&source=&limit=10`
- `GET /api/artists/:id?source=`
- `GET /api/artists/:id/albums?source=&limit=18`
- `GET /api/artists/:id/tracks?source=&limit=12`
- `GET /api/artists/:id/image?source=` — AudioDB (MBID → nombre) → fuente original → null
- `GET /api/genres/:genreId/artists?source=&limit=10`
- `GET /api/genres/:genreId/tracks?source=&limit=12`

Códigos de error del proxy: `400` source inválido · `404` no encontrado · `502 premium_required` / `502 request_failed` · `503 no_credentials` (falta API key).

> **MusicBrainz** se serializa a ~1 req/s con `User-Agent: Sonograph/1.0`.
> **Spotify** requiere `SPOTIFY_CLIENT_ID`/`SECRET` y una cuenta **Premium** del desarrollador; sin Premium la API responde `502 premium_required` (ver TODO en `.env.example`).
> **Last.fm** requiere `LASTFM_API_KEY`. **AudioDB** usa la key pública `123`.

### Postman

Importa `SonoGraphAPI.postman_collection.json`. Register/Login/Refresh guardan los tokens automáticamente en variables de la colección.
