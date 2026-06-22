// DataSource de pruebas: corre las migraciones reales de TypeORM contra el
// Postgres efímero de Testcontainers (sin SSL). Las clases de migración se
// importan explícitamente porque en los tests no existe el bundle de `dist/`.
import { DataSource } from 'typeorm';
import { Family } from '../src/entities/family.entity';
import { Genre } from '../src/entities/genre.entity';
import { GenreRelation } from '../src/entities/genre-relation.entity';
import { GenreParent } from '../src/entities/genre-parent.entity';
import { GenreSourceTag } from '../src/entities/genre-source-tag.entity';
import { User } from '../src/entities/user.entity';
import { FavoriteGenre } from '../src/entities/favorite-genre.entity';
import { FavoriteArtist } from '../src/entities/favorite-artist.entity';
import { FavoriteTrack } from '../src/entities/favorite-track.entity';
import { FavoriteAlbum } from '../src/entities/favorite-album.entity';
import { GenreVisit } from '../src/entities/genre-visit.entity';
import { InitSchema1779593844389 } from '../src/core/db/migrations/1779593844389-InitSchema';
import { GenreMultiParent1779594793131 } from '../src/core/db/migrations/1779594793131-GenreMultiParent';
import { AddCheckConstraints1779595477517 } from '../src/core/db/migrations/1779595477517-AddCheckConstraints';
import { EnableRls1779700000000 } from '../src/core/db/migrations/1779700000000-EnableRls';

export function buildTestDataSource(url: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url,
    ssl: false,
    synchronize: false,
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
    // TypeORM las ordena por el timestamp del nombre antes de ejecutarlas.
    migrations: [
      InitSchema1779593844389,
      GenreMultiParent1779594793131,
      AddCheckConstraints1779595477517,
      EnableRls1779700000000,
    ],
  });
}
