import { Controller, Get, Param } from '@nestjs/common';
import { FamilyResponse, GenreResponse } from './dto/genre-response.dto';
import { GenresService } from './genres.service';

@Controller()
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get('families')
  getFamilies(): Promise<FamilyResponse[]> {
    return this.genresService.findAllFamilies();
  }

  @Get('genres')
  getGenres(): Promise<GenreResponse[]> {
    return this.genresService.findAllGenres();
  }

  @Get('genres/:id')
  getGenre(@Param('id') id: string): Promise<GenreResponse> {
    return this.genresService.findGenreById(id);
  }
}
