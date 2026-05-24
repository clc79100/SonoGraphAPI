import { DataSource, DataSourceOptions } from 'typeorm';
import { envs } from '../../config/envs';
import { Family } from '../../entities/family.entity';
import { Genre } from '../../entities/genre.entity';
import { GenreRelation } from '../../entities/genre-relation.entity';
import { GenreParent } from '../../entities/genre-parent.entity';
import { GenreSourceTag } from '../../entities/genre-source-tag.entity';
import { User } from '../../entities/user.entity';
import { FavoriteGenre } from '../../entities/favorite-genre.entity';
import { FavoriteArtist } from '../../entities/favorite-artist.entity';
import { FavoriteTrack } from '../../entities/favorite-track.entity';
import { FavoriteAlbum } from '../../entities/favorite-album.entity';
import { GenreVisit } from '../../entities/genre-visit.entity';

const baseOptions = {
  type: 'postgres' as const,
  entities: [
    Family,
    Genre,
    GenreRelation,
    GenreParent,
    GenreSourceTag,
    User,
    FavoriteGenre,
    FavoriteArtist,
    FavoriteTrack,
    FavoriteAlbum,
    GenreVisit,
  ],
  migrations: ['dist/core/db/migrations/*.js'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
};

// Usado por TypeOrmModule.forRoot en la app → pooler de Supabase (queries)
export const dataSourceOptions: DataSourceOptions = {
  ...baseOptions,
  url: envs.DATABASE_URL,
};

// Cargado por la CLI de TypeORM → conexión directa (migraciones)
export const dataSource = new DataSource({
  ...baseOptions,
  url: envs.DIRECT_URL,
});
