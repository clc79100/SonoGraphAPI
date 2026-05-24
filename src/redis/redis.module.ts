import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { envs } from '../config/envs';
import { REDIS_CLIENT, RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('Redis');
        const client = new Redis({
          host: envs.REDIS_HOST,
          port: envs.REDIS_PORT,
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });
        client.on('connect', () => logger.log('Connected'));
        client.on('error', (err) => logger.error(err.message));
        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
