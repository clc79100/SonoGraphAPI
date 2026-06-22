import { Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Family } from '../entities/family.entity';
import { Genre } from '../entities/genre.entity';
import { GenreRelation } from '../entities/genre-relation.entity';
import { GenreParent } from '../entities/genre-parent.entity';
import { GenreSourceTag } from '../entities/genre-source-tag.entity';
import { FamilyResponse, GenreResponse, SourceTagsResponse } from './dto/genre-response.dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Family) private readonly familiesRepo: Repository<Family>,
    @InjectRepository(Genre) private readonly genresRepo: Repository<Genre>,
    @InjectRepository(GenreRelation)
    private readonly relationsRepo: Repository<GenreRelation>,
    @InjectRepository(GenreParent)
    private readonly parentsRepo: Repository<GenreParent>,
    @InjectRepository(GenreSourceTag)
    private readonly sourceTagsRepo: Repository<GenreSourceTag>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async findAllFamilies(): Promise<FamilyResponse[]> {
    const families = await this.familiesRepo.find({ order: { id: 'ASC' } });
    return families.map((f) => ({ id: f.id, name: f.name }));
  }

  async findAllGenres(): Promise<GenreResponse[]> {
    const [genres, parents, relations, sourceTags] = await Promise.all([
      this.genresRepo.find({ order: { id: 'ASC' } }),
      this.parentsRepo.find(),
      this.relationsRepo.find(),
      this.sourceTagsRepo.find(),
    ]);

    this.logger.log('Genre graph loaded', 'GenresService');

    const parentsByGenre = groupBy(
      parents,
      (p) => p.genreId,
      (p) => p.parentId,
    );
    const relatedByGenre = groupBy(
      relations,
      (r) => r.genreId,
      (r) => r.relatedId,
    );
    const tagsByGenre = groupSourceTags(sourceTags);

    return genres.map((g) =>
      toGenreResponse(
        g,
        parentsByGenre.get(g.id) ?? [],
        relatedByGenre.get(g.id) ?? [],
        tagsByGenre.get(g.id) ?? {},
      ),
    );
  }

  async findGenreById(id: string): Promise<GenreResponse> {
    const genre = await this.genresRepo.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre '${id}' not found`);
    }
    const [parents, relations, sourceTags] = await Promise.all([
      this.parentsRepo.find({ where: { genreId: id } }),
      this.relationsRepo.find({ where: { genreId: id } }),
      this.sourceTagsRepo.find({ where: { genreId: id } }),
    ]);
    const tags = groupSourceTags(sourceTags).get(id) ?? {};
    return toGenreResponse(
      genre,
      parents.map((p) => p.parentId),
      relations.map((r) => r.relatedId),
      tags,
    );
  }
}

function toGenreResponse(
  genre: Genre,
  parents: string[],
  related: string[],
  sourceTags: SourceTagsResponse,
): GenreResponse {
  const response: GenreResponse = {
    id: genre.id,
    name: genre.name,
    family: genre.familyId,
    parents,
    related,
  };
  if (genre.era) response.era = genre.era;
  if (genre.region) response.region = genre.region;
  if (genre.description) response.description = genre.description;
  if (Object.keys(sourceTags).length > 0) response.sourceTags = sourceTags;
  return response;
}

function groupBy<T, V>(
  items: T[],
  keyFn: (item: T) => string,
  valueFn: (item: T) => V,
): Map<string, V[]> {
  const map = new Map<string, V[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key) ?? [];
    bucket.push(valueFn(item));
    map.set(key, bucket);
  }
  return map;
}

function groupSourceTags(tags: GenreSourceTag[]): Map<string, SourceTagsResponse> {
  const map = new Map<string, SourceTagsResponse>();
  for (const t of tags) {
    const entry = map.get(t.genreId) ?? {};
    entry[t.source] = t.tag;
    map.set(t.genreId, entry);
  }
  return map;
}
