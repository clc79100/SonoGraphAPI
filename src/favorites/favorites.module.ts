import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteAlbum } from '../entities/favorite-album.entity';
import { FavoriteArtist } from '../entities/favorite-artist.entity';
import { FavoriteGenre } from '../entities/favorite-genre.entity';
import { FavoriteTrack } from '../entities/favorite-track.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FavoriteGenre,
      FavoriteArtist,
      FavoriteTrack,
      FavoriteAlbum,
    ]),
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
