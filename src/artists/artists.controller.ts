import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { ParseSourcePipe } from './parse-source.pipe';
import { ProxyExceptionFilter } from './proxy-exception.filter';
import { Source } from '../proxy/types';

@UseFilters(ProxyExceptionFilter)
@Controller('api')
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get('search/artists')
  search(
    @Query('q') q: string,
    @Query('source', ParseSourcePipe) source: Source,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.artists.searchArtists(source, q ?? '', limit);
  }

  @Get('artists/:id')
  getArtist(@Param('id') id: string, @Query('source', ParseSourcePipe) source: Source) {
    return this.artists.getArtist(source, id);
  }

  @Get('artists/:id/albums')
  getAlbums(
    @Param('id') id: string,
    @Query('source', ParseSourcePipe) source: Source,
    @Query('limit', new DefaultValuePipe(18), ParseIntPipe) limit: number,
  ) {
    return this.artists.getAlbums(source, id, limit);
  }

  @Get('artists/:id/tracks')
  getTracks(
    @Param('id') id: string,
    @Query('source', ParseSourcePipe) source: Source,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.artists.getTracks(source, id, limit);
  }

  @Get('artists/:id/image')
  getImage(@Param('id') id: string, @Query('source', ParseSourcePipe) source: Source) {
    return this.artists.getImage(source, id);
  }

  @Get('genres/:genreId/artists')
  genreArtists(
    @Param('genreId') genreId: string,
    @Query('source', ParseSourcePipe) source: Source,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.artists.genreArtists(genreId, source, limit);
  }

  @Get('genres/:genreId/tracks')
  genreTracks(
    @Param('genreId') genreId: string,
    @Query('source', ParseSourcePipe) source: Source,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.artists.genreTracks(genreId, source, limit);
  }
}
