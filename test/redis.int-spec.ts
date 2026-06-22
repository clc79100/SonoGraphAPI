// Container test de Redis (BD NoSQL): set/get/expire + invalidación de caché,
// con limpieza (flushdb) entre tests para aislamiento.
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { StartedRedisContainer } from '@testcontainers/redis';
import type { Redis as RedisClient } from 'ioredis';

let container: StartedRedisContainer;
let client: RedisClient;

beforeAll(async () => {
  const { RedisContainer } = await import('@testcontainers/redis');
  const { default: Redis } = await import('ioredis');
  container = await new RedisContainer('redis:7-alpine').start();
  client = new Redis(container.getConnectionUrl());
}, 120000);

// Aislamiento: cada test parte de una BD vacía.
afterEach(async () => {
  await client.flushdb();
});

afterAll(async () => {
  await client?.quit();
  await container?.stop();
});

describe('Redis (container test)', () => {
  it('set y get devuelven el valor almacenado', async () => {
    // Arrange
    await client.set('artists:search:lastfm:muse', 'cached');
    // Act
    const value = await client.get('artists:search:lastfm:muse');
    // Assert
    expect(value).toBe('cached');
  });

  it('una clave con TTL corto expira (expire)', async () => {
    // Arrange
    await client.set('spotify:token', 'abc', 'PX', 50);
    // Act
    await new Promise((r) => setTimeout(r, 120));
    const value = await client.get('spotify:token');
    // Assert
    expect(value).toBeNull();
  });

  it('invalidación de caché: del elimina la clave', async () => {
    // Arrange
    await client.set('genres:all', 'payload');
    // Act
    await client.del('genres:all');
    const value = await client.get('genres:all');
    // Assert
    expect(value).toBeNull();
  });

  it('flushdb aísla los tests: la BD queda vacía', async () => {
    // Act
    const size = await client.dbsize();
    // Assert
    expect(size).toBe(0);
  });
});
