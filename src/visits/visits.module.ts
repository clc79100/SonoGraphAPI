import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenreVisit } from '../entities/genre-visit.entity';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [TypeOrmModule.forFeature([GenreVisit])],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
