import { MigrationInterface, QueryRunner } from 'typeorm';

// Habilita Row Level Security en todas las tablas del schema public.
// Sin políticas: PostgREST/anon queda sin acceso (deny-all), mientras que la API
// conecta como `postgres` (owner + BYPASSRLS) y no se ve afectada.
// Resuelve el advisor 0013_rls_disabled_in_public de Supabase.
const TABLES = [
  'families',
  'genres',
  'genre_relations',
  'genre_parents',
  'genre_source_tags',
  'users',
  'favorite_genres',
  'favorite_artists',
  'favorite_tracks',
  'favorite_albums',
  'genre_visits',
  'migrations',
];

export class EnableRls1779700000000 implements MigrationInterface {
  name = 'EnableRls1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of TABLES) {
      await queryRunner.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of TABLES) {
      await queryRunner.query(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
