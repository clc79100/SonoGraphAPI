import { Global, LoggerService, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { envs } from '../config/envs';
import { REDIS_CLIENT, RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (logger: LoggerService) => {
        const client = new Redis({
          host: envs.REDIS_HOST,
          port: envs.REDIS_PORT,
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });
        client.on('connect', () => logger.log('Connected', 'Redis'));
        client.on('error', (err: Error) => logger.error(err.message, undefined, 'Redis'));
        return client;
      },
      inject: [WINSTON_MODULE_NEST_PROVIDER],
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
