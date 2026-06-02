import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(
    private readonly redis: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getOrSet<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) {
      this.logger.log(`Cache hit: ${key}`, 'CacheService');
      return JSON.parse(cached) as T;
    }
    this.logger.log(`Cache miss: ${key}`, 'CacheService');
    const value = await producer();
    await this.redis.setEx(key, ttlSeconds, JSON.stringify(value));
    return value;
  }
}
