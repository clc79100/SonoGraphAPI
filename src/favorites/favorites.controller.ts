import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AddFavoriteAlbumDto,
  AddFavoriteArtistDto,
  AddFavoriteTrackDto,
} from './dto/add-favorite.dto';
import { FavoritesService } from './favorites.service';

@UseGuards(JwtAuthGuard)
@Controller('users/me/favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  // ---- Genres ----
  @Get('genres')
  listGenres(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listGenres(user.userId);
  }

  @Post('genres/:genreId')
  addGenre(@CurrentUser() user: AuthenticatedUser, @Param('genreId') genreId: string) {
    return this.favorites.addGenre(user.userId, genreId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('genres/:genreId')
  removeGenre(@CurrentUser() user: AuthenticatedUser, @Param('genreId') genreId: string) {
    return this.favorites.removeGenre(user.userId, genreId);
  }

  // ---- Artists ----
  @Get('artists')
  listArtists(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listArtists(user.userId);
  }

  @Post('artists')
  addArtist(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteArtistDto) {
    return this.favorites.addArtist(user.userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('artists/:id')
  removeArtist(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.favorites.removeArtist(user.userId, id);
  }

  // ---- Tracks ----
  @Get('tracks')
  listTracks(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listTracks(user.userId);
  }

  @Post('tracks')
  addTrack(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteTrackDto) {
    return this.favorites.addTrack(user.userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('tracks/:id')
  removeTrack(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.favorites.removeTrack(user.userId, id);
  }

  // ---- Albums ----
  @Get('albums')
  listAlbums(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.listAlbums(user.userId);
  }

  @Post('albums')
  addAlbum(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteAlbumDto) {
    return this.favorites.addAlbum(user.userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('albums/:id')
  removeAlbum(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.favorites.removeAlbum(user.userId, id);
  }
}
