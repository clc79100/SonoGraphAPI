import 'dotenv/config';
import * as env from 'env-var';

export const envs = {
  PORT: env.get('PORT').default(3000).asPortNumber(),
  NODE_ENV: env.get('NODE_ENV').default('development').asString(),
  CORS_ORIGIN: env.get('CORS_ORIGIN').default('http://localhost:8080').asString(),

  // Pooler de Supabase (puerto 6543) — consultas en runtime
  DATABASE_URL: env.get('DATABASE_URL').required().asString(),
  // Conexión directa (puerto 5432) — migraciones de TypeORM
  DIRECT_URL: env.get('DIRECT_URL').required().asString(),

  REDIS_HOST: env.get('REDIS_HOST').required().asString(),
  REDIS_PORT: env.get('REDIS_PORT').required().asPortNumber(),

  JWT_SECRET: env.get('JWT_SECRET').required().asString(),
  JWT_REFRESH_SECRET: env.get('JWT_REFRESH_SECRET').required().asString(),
  JWT_ACCESS_TTL: env.get('JWT_ACCESS_TTL').default(900).asIntPositive(),
  JWT_REFRESH_TTL: env.get('JWT_REFRESH_TTL').default(604800).asIntPositive(),

  // Credenciales de fuentes externas (proxy). Opcionales: si faltan, el
  // service correspondiente responde "no_credentials" en vez de tumbar el arranque.
  // TODO(revisar envs): SPOTIFY_CLIENT_ID/SECRET no funcionan sin una cuenta
  // Spotify Premium en la app del desarrollador — la API bloquea /search y demás.
  SPOTIFY_CLIENT_ID: env.get('SPOTIFY_CLIENT_ID').default('').asString(),
  SPOTIFY_CLIENT_SECRET: env.get('SPOTIFY_CLIENT_SECRET').default('').asString(),
  LASTFM_API_KEY: env.get('LASTFM_API_KEY').default('').asString(),

  APPLICATIONINSIGHTS_CONNECTION_STRING: env
    .get('APPLICATIONINSIGHTS_CONNECTION_STRING')
    .default('')
    .asString(),
};
