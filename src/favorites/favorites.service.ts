import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { FavoriteAlbum } from '../entities/favorite-album.entity';
import { FavoriteArtist } from '../entities/favorite-artist.entity';
import { FavoriteGenre } from '../entities/favorite-genre.entity';
import { FavoriteTrack } from '../entities/favorite-track.entity';
import {
  AddFavoriteAlbumDto,
  AddFavoriteArtistDto,
  AddFavoriteTrackDto,
} from './dto/add-favorite.dto';

const PG_FK_VIOLATION = '23503';

function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof QueryFailedError && (err.driverError as any)?.code === PG_FK_VIOLATION;
}

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteGenre)
    private readonly genresRepo: Repository<FavoriteGenre>,
    @InjectRepository(FavoriteArtist)
    private readonly artistsRepo: Repository<FavoriteArtist>,
    @InjectRepository(FavoriteTrack)
    private readonly tracksRepo: Repository<FavoriteTrack>,
    @InjectRepository(FavoriteAlbum)
    private readonly albumsRepo: Repository<FavoriteAlbum>,
  ) {}

  // ---- Genres ----
  listGenres(userId: string): Promise<FavoriteGenre[]> {
    return this.genresRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addGenre(userId: string, genreId: string): Promise<FavoriteGenre> {
    const existing = await this.genresRepo.findOne({ where: { userId, genreId } });
    if (existing) return existing;
    const fav = this.genresRepo.create({ userId, genreId });
    try {
      return await this.genresRepo.save(fav);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new NotFoundException(`Genre '${genreId}' not found`);
      }
      throw err;
    }
  }

  async removeGenre(userId: string, genreId: string): Promise<void> {
    await this.genresRepo.delete({ userId, genreId });
  }

  // ---- Artists ----
  listArtists(userId: string): Promise<FavoriteArtist[]> {
    return this.artistsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addArtist(userId: string, dto: AddFavoriteArtistDto): Promise<FavoriteArtist> {
    const existing = await this.artistsRepo.findOne({
      where: { userId, externalId: dto.externalId, source: dto.source },
    });
    if (existing) return existing;
    const fav = this.artistsRepo.create({
      userId,
      externalId: dto.externalId,
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      source: dto.source,
    });
    return this.artistsRepo.save(fav);
  }

  async removeArtist(userId: string, id: string): Promise<void> {
    await this.artistsRepo.delete({ id, userId });
  }

  // ---- Tracks ----
  listTracks(userId: string): Promise<FavoriteTrack[]> {
    return this.tracksRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addTrack(userId: string, dto: AddFavoriteTrackDto): Promise<FavoriteTrack> {
    const existing = await this.tracksRepo.findOne({
      where: { userId, externalId: dto.externalId, source: dto.source },
    });
    if (existing) return existing;
    const fav = this.tracksRepo.create({
      userId,
      externalId: dto.externalId,
      title: dto.title,
      artistName: dto.artistName ?? null,
      source: dto.source,
    });
    return this.tracksRepo.save(fav);
  }

  async removeTrack(userId: string, id: string): Promise<void> {
    await this.tracksRepo.delete({ id, userId });
  }

  // ---- Albums ----
  listAlbums(userId: string): Promise<FavoriteAlbum[]> {
    return this.albumsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addAlbum(userId: string, dto: AddFavoriteAlbumDto): Promise<FavoriteAlbum> {
    const existing = await this.albumsRepo.findOne({
      where: { userId, externalId: dto.externalId, source: dto.source },
    });
    if (existing) return existing;
    const fav = this.albumsRepo.create({
      userId,
      externalId: dto.externalId,
      title: dto.title,
      artistName: dto.artistName ?? null,
      imageUrl: dto.imageUrl ?? null,
      source: dto.source,
    });
    return this.albumsRepo.save(fav);
  }

  async removeAlbum(userId: string, id: string): Promise<void> {
    await this.albumsRepo.delete({ id, userId });
  }
}
