import { dataSource } from './data-source';
import { Family } from '../../entities/family.entity';
import { Genre } from '../../entities/genre.entity';
import { GenreParent } from '../../entities/genre-parent.entity';
import { GenreRelation } from '../../entities/genre-relation.entity';
import { EXTERNAL_SOURCES, GenreSourceTag } from '../../entities/genre-source-tag.entity';
import { FAMILIES, GENRES } from './seed-data/genres';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function seed() {
  await dataSource.initialize();
  const familyRepo = dataSource.getRepository(Family);
  const genreRepo = dataSource.getRepository(Genre);
  const parentRepo = dataSource.getRepository(GenreParent);
  const relationRepo = dataSource.getRepository(GenreRelation);
  const sourceTagRepo = dataSource.getRepository(GenreSourceTag);

  const genreIds = new Set(GENRES.map((g) => g.id));

  // 1. Familias (upsert por PK)
  await familyRepo.upsert(
    FAMILIES.map((f) => ({ id: f.id, name: f.name })),
    ['id'],
  );

  // 2. Géneros (upsert por PK) — sin parents/related (eso va en tablas join).
  // El dataset curado trae ids repetidos; dedup por id (última entrada gana)
  // para no romper el ON CONFLICT (Postgres rechaza el mismo key 2x por comando).
  const genreById = new Map<
    string,
    {
      id: string;
      name: string;
      familyId: string;
      era: string | null;
      region: string | null;
      description: string | null;
    }
  >();
  for (const g of GENRES) {
    genreById.set(g.id, {
      id: g.id,
      name: g.name,
      familyId: g.family,
      era: g.era ?? null,
      region: g.region ?? null,
      description: g.description ?? null,
    });
  }
  const genreRows = [...genreById.values()];
  for (const batch of chunk(genreRows, 200)) {
    await genreRepo.upsert(batch, ['id']);
  }

  // 3. genre_parents — solo refs válidas, sin self-ref, sin duplicados
  const parentPairs = new Set<string>();
  const relationPairs = new Set<string>();
  const parentRows: { genreId: string; parentId: string }[] = [];
  const relationRows: { genreId: string; relatedId: string }[] = [];
  for (const g of GENRES) {
    for (const p of g.parents ?? []) {
      if (p !== g.id && genreIds.has(p) && !parentPairs.has(`${g.id}|${p}`)) {
        parentPairs.add(`${g.id}|${p}`);
        parentRows.push({ genreId: g.id, parentId: p });
      }
    }
    for (const r of g.related ?? []) {
      if (r !== g.id && genreIds.has(r) && !relationPairs.has(`${g.id}|${r}`)) {
        relationPairs.add(`${g.id}|${r}`);
        relationRows.push({ genreId: g.id, relatedId: r });
      }
    }
  }

  for (const batch of chunk(parentRows, 300)) {
    await parentRepo.createQueryBuilder().insert().values(batch).orIgnore().execute();
  }
  for (const batch of chunk(relationRows, 300)) {
    await relationRepo.createQueryBuilder().insert().values(batch).orIgnore().execute();
  }

  // 4. genre_source_tags — sin datos curados por fuente, usamos el nombre del
  // género en minúsculas como tag para las 3 fuentes (editable a mano después).
  const sourceTagRows = genreRows.flatMap((g) =>
    EXTERNAL_SOURCES.map((source) => ({
      genreId: g.id,
      source,
      tag: g.name.toLowerCase(),
    })),
  );
  for (const batch of chunk(sourceTagRows, 300)) {
    await sourceTagRepo.upsert(batch, ['genreId', 'source']);
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed OK → familias: ${FAMILIES.length}, géneros: ${GENRES.length}, ` +
      `parents: ${parentRows.length}, relations: ${relationRows.length}, ` +
      `sourceTags: ${sourceTagRows.length}`,
  );
  await dataSource.destroy();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed falló:', err);
  process.exit(1);
});
