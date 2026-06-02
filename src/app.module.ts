import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
    RedisModule,
    CacheModule,
    AuthModule,
    GenresModule,
    FavoritesModule,
    VisitsModule,
    ArtistsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
