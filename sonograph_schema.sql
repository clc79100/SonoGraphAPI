-- ============================================================
-- Sonograph — Schema PostgreSQL (Supabase)
-- 10 tablas relacionales + 2 estructuras Redis (ver comentarios)
-- ============================================================

-- ------------------------------------------------------------
-- 1. FAMILIES
-- Agrupaciones de géneros (rock, metal, jazz, etc.)
-- Los colores de familia son responsabilidad del frontend (CSS vars)
-- ------------------------------------------------------------
CREATE TABLE families (
  id    TEXT PRIMARY KEY,  -- "rock", "electronic", "jazz" ...
  name  TEXT NOT NULL      -- "Rock", "Electrónica", "Jazz" (display)
);

-- ------------------------------------------------------------
-- 2. GENRES
-- Géneros musicales con self-reference para jerarquía padre/hijo
-- ------------------------------------------------------------
CREATE TABLE genres (
  id           TEXT PRIMARY KEY,                       -- "alternative-rock"
  name         TEXT        NOT NULL,                   -- "Alternative Rock"
  family_id    TEXT        NOT NULL REFERENCES families(id),
  parent_id    TEXT        REFERENCES genres(id),      -- NULL = género raíz
  era          TEXT,                                   -- "1980s-90s"
  region       TEXT,                                   -- "UK", "US"
  description  TEXT
);

CREATE INDEX idx_genres_family  ON genres(family_id);
CREATE INDEX idx_genres_parent  ON genres(parent_id);

-- ------------------------------------------------------------
-- 3. GENRE_RELATIONS
-- Aristas de afinidad débil entre géneros (many-to-many)
-- Distinto a parent_id que es relación jerárquica
-- ------------------------------------------------------------
CREATE TABLE genre_relations (
  genre_id    TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  related_id  TEXT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (genre_id, related_id),
  CHECK (genre_id <> related_id)
);

-- ------------------------------------------------------------
-- 4. GENRE_SOURCE_TAGS
-- Mapeo de genre_id → tag exacto por fuente externa
-- Evita lógica condicional en el proxy de NestJS
-- ------------------------------------------------------------
CREATE TABLE genre_source_tags (
  genre_id  TEXT  NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  source    TEXT  NOT NULL CHECK (source IN ('musicbrainz', 'spotify', 'lastfm')),
  tag       TEXT  NOT NULL,
  PRIMARY KEY (genre_id, source)
);

-- ------------------------------------------------------------
-- 5. USERS
-- Auth básica. Passwords hasheadas con bcrypt en NestJS.
-- ------------------------------------------------------------
CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        UNIQUE NOT NULL,
  password_hash  TEXT        NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. FAVORITE_GENRES
-- Géneros marcados como favoritos por el usuario
-- ------------------------------------------------------------
CREATE TABLE favorite_genres (
  user_id     UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre_id    TEXT  NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, genre_id)
);

-- ------------------------------------------------------------
-- 7. FAVORITE_ARTISTS
-- Artistas favoritos — datos desnormalizados de la fuente externa
-- external_id es el ID en MB/Spotify/Last.fm según source
-- ------------------------------------------------------------
CREATE TABLE favorite_artists (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_id  TEXT  NOT NULL,
  name         TEXT  NOT NULL,
  image_url    TEXT,
  source       TEXT  NOT NULL CHECK (source IN ('musicbrainz', 'spotify', 'lastfm')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, external_id, source)
);

CREATE INDEX idx_fav_artists_user ON favorite_artists(user_id);

-- ------------------------------------------------------------
-- 8. FAVORITE_TRACKS
-- Tracks favoritos — datos desnormalizados de la fuente externa
-- ------------------------------------------------------------
CREATE TABLE favorite_tracks (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_id  TEXT  NOT NULL,
  title        TEXT  NOT NULL,
  artist_name  TEXT,
  source       TEXT  NOT NULL CHECK (source IN ('musicbrainz', 'spotify', 'lastfm')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, external_id, source)
);

CREATE INDEX idx_fav_tracks_user ON favorite_tracks(user_id);

-- ------------------------------------------------------------
-- 9. FAVORITE_ALBUMS
-- Álbumes favoritos — datos desnormalizados de la fuente externa
-- ------------------------------------------------------------
CREATE TABLE favorite_albums (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_id  TEXT  NOT NULL,
  title        TEXT  NOT NULL,
  artist_name  TEXT,
  image_url    TEXT,
  source       TEXT  NOT NULL CHECK (source IN ('musicbrainz', 'spotify', 'lastfm')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, external_id, source)
);

CREATE INDEX idx_fav_albums_user ON favorite_albums(user_id);

-- ------------------------------------------------------------
-- 10. GENRE_VISITS
-- Historial de géneros visitados por el usuario en el grafo
-- Sin UNIQUE: cada click inserta una fila nueva
-- Útil para: géneros recientes, más visitados, heatmap de actividad
-- ------------------------------------------------------------
CREATE TABLE genre_visits (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre_id    TEXT  NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  visited_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_genre_visits_user ON genre_visits(user_id);

-- ============================================================
-- REDIS — Estructuras (no son tablas SQL)
-- ============================================================
--
-- 11. refresh_token:{userId}
--     Tipo: String (JWT refresh token)
--     TTL:  7 días (o el tiempo de vida del refresh token)
--     SET refresh_token:550e8400-... "eyJhbGci..." EX 604800
--     DEL al logout o rotación de token
--
-- 12. blacklist:{jti}
--     Tipo: String (valor: "1" o timestamp de revocación)
--     TTL:  igual al tiempo restante del access token (ej. 15min)
--     SET blacklist:abc123jti "1" EX 900
--     Se consulta en cada request autenticado para validar que
--     el JWT no fue revocado (logout, cambio de password, etc.)
-- ============================================================
