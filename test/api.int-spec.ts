// Pruebas de integración de la API REST + container test de PostgreSQL.
// Levanta un Postgres efímero (Testcontainers), corre las migraciones reales,
// arranca la app NestJS y prueba el contrato HTTP con Supertest.
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedRedisContainer } from '@testcontainers/redis';
import request from 'supertest';

let app: INestApplication;
let dataSource: DataSource;
let pg: StartedPostgreSqlContainer;
let redis: StartedRedisContainer;

beforeAll(async () => {
  const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
  const { RedisContainer } = await import('@testcontainers/redis');

  // 1) Contenedores efímeros (no tocan Supabase ni Upstash).
  pg = await new PostgreSqlContainer('postgres:16-alpine').start();
  redis = await new RedisContainer('redis:7-alpine').start();

  // 2) Config por entorno ANTES de importar la app (envs se lee al importar).
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.DIRECT_URL = pg.getConnectionUri();
  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = String(redis.getMappedPort(6379));
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  // 3) Migraciones reales de TypeORM contra el Postgres de test.
  const { buildTestDataSource } = await import('./test-data-source');
  const migrationDs = buildTestDataSource(pg.getConnectionUri());
  await migrationDs.initialize();
  await migrationDs.runMigrations();
  await migrationDs.destroy();

  // 4) App NestJS (mismo ValidationPipe que main.ts).
  const { Test } = await import('@nestjs/testing');
  const { ValidationPipe } = await import('@nestjs/common');
  const { AppModule } = await import('../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  const { DataSource } = await import('typeorm');
  dataSource = app.get(DataSource);
}, 180000);

// Aislamiento entre tests: limpia las tablas con datos de usuario.
afterEach(async () => {
  await dataSource.query(
    `TRUNCATE TABLE users, favorite_genres, favorite_artists, favorite_tracks,
     favorite_albums, genre_visits RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await app?.close();
  await pg?.stop();
  await redis?.stop();
});

describe('API REST (integración)', () => {
  it('TC-API-001: happy path GET /genres devuelve 200 y un array', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/genres');
    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('TC-API-002: validación de entrada → 400 al registrar sin campos', async () => {
    // Act
    const res = await request(app.getHttpServer()).post('/auth/register').send({});
    // Assert
    expect(res.status).toBe(400);
  });

  it('TC-API-003: autenticación → 401 en favoritos sin token', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/users/me/favorites/genres');
    // Assert
    expect(res.status).toBe(401);
  });

  it('TC-API-004: recurso inexistente → 404 en género que no existe', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/genres/no-existe');
    // Assert
    expect(res.status).toBe(404);
  });

  it('TC-API-005: conflicto → 409 al registrar un email duplicado', async () => {
    // Arrange
    const body = { email: 'dup@test.com', password: 'password123' };
    await request(app.getHttpServer()).post('/auth/register').send(body);
    // Act
    const res = await request(app.getHttpServer()).post('/auth/register').send(body);
    // Assert
    expect(res.status).toBe(409);
  });
});

describe('PostgreSQL (container test)', () => {
  it('las migraciones crearon el esquema (tabla users consultable)', async () => {
    // Act
    const rows = await dataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'`,
    );
    // Assert
    expect(rows).toHaveLength(1);
  });

  it('el aislamiento por TRUNCATE deja la tabla users vacía entre tests', async () => {
    // Act
    const rows = await dataSource.query('SELECT COUNT(*)::int AS count FROM users');
    // Assert
    expect(rows[0].count).toBe(0);
  });
});
