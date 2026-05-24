import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../entities/genre.entity';
import { GenreSourceTag } from '../entities/genre-source-tag.entity';
import { ProxyModule } from '../proxy/proxy.module';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre, GenreSourceTag]), ProxyModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
