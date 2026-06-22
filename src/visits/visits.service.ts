import { Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { QueryFailedError, Repository } from 'typeorm';
import { GenreVisit } from '../entities/genre-visit.entity';

const PG_FK_VIOLATION = '23503';

export interface RecentVisit {
  genreId: string;
  lastVisit: Date;
}

export interface TopVisit {
  genreId: string;
  visits: number;
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(GenreVisit)
    private readonly visitsRepo: Repository<GenreVisit>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async record(userId: string, genreId: string): Promise<GenreVisit> {
    const visit = this.visitsRepo.create({ userId, genreId });
    try {
      const saved = await this.visitsRepo.save(visit);
      this.logger.log(`Genre visited: ${genreId} by ${userId}`, 'VisitsService');
      return saved;
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === PG_FK_VIOLATION
      ) {
        throw new NotFoundException(`Genre '${genreId}' not found`);
      }
      throw err;
    }
  }

  async recent(userId: string, limit: number): Promise<RecentVisit[]> {
    const rows = await this.visitsRepo
      .createQueryBuilder('v')
      .select('v.genre_id', 'genreId')
      .addSelect('MAX(v.visited_at)', 'lastVisit')
      .where('v.user_id = :userId', { userId })
      .groupBy('v.genre_id')
      .orderBy('"lastVisit"', 'DESC')
      .limit(limit)
      .getRawMany<{ genreId: string; lastVisit: Date }>();
    return rows;
  }

  async top(userId: string, limit: number): Promise<TopVisit[]> {
    const rows = await this.visitsRepo
      .createQueryBuilder('v')
      .select('v.genre_id', 'genreId')
      .addSelect('COUNT(*)', 'visits')
      .where('v.user_id = :userId', { userId })
      .groupBy('v.genre_id')
      .orderBy('visits', 'DESC')
      .limit(limit)
      .getRawMany<{ genreId: string; visits: string }>();
    return rows.map((r) => ({ genreId: r.genreId, visits: Number(r.visits) }));
  }
}
