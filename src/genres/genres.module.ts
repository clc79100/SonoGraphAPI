import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../entities/family.entity';
import { Genre } from '../entities/genre.entity';
import { GenreRelation } from '../entities/genre-relation.entity';
import { GenreParent } from '../entities/genre-parent.entity';
import { GenreSourceTag } from '../entities/genre-source-tag.entity';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

@Module({
  imports: [TypeOrmModule.forFeature([Family, Genre, GenreRelation, GenreParent, GenreSourceTag])],
  controllers: [GenresController],
  providers: [GenresService],
})
export class GenresModule {}
