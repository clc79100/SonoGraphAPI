import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './core/db/data-source';
import { LoggerModule } from './core/logger/logger.module';
import { HttpLoggerMiddleware } from './core/logger/http-logger.middleware';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from './cache/cache.module';
import { GenresModule } from './genres/genres.module';
import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
import { VisitsModule } from './visits/visits.module';
import { ArtistsModule } from './artists/artists.module';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    RedisModule,
    CacheModule,
    AuthModule,
    GenresModule,
    FavoritesModule,
    VisitsModule,
    ArtistsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
