import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  // Devuelve el valor cacheado o ejecuta `producer`, cachea su resultado y lo
  // devuelve. Solo cachea resultados exitosos (los errores se propagan sin cachear).
  async getOrSet<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
    const value = await producer();
    await this.redis.setEx(key, ttlSeconds, JSON.stringify(value));
    return value;
  }
}
