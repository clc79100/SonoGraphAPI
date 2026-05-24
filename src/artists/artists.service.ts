import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { Genre } from '../entities/genre.entity';
import { GenreSourceTag } from '../entities/genre-source-tag.entity';
import { AudiodbService } from '../proxy/audiodb.service';
import { LastfmService } from '../proxy/lastfm.service';
import { MusicbrainzService } from '../proxy/musicbrainz.service';
import { SpotifyService } from '../proxy/spotify.service';
import {
  SearchArtist,
  SimpleTrack,
  Source,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedTrack,
} from '../proxy/types';

const TTL = {
  search: 3600, // 1h
  detail: 86400, // 24h
  albums: 86400,
  tracks: 86400,
  image: 604800, // 7d
  genre: 3600, // 1h
};

@Injectable()
export class ArtistsService {
  constructor(
    private readonly mb: MusicbrainzService,
    private readonly spotify: SpotifyService,
    private readonly lastfm: LastfmService,
    private readonly audiodb: AudiodbService,
    private readonly cache: CacheService,
    @InjectRepository(Genre) private readonly genresRepo: Repository<Genre>,
    @InjectRepository(GenreSourceTag)
    private readonly sourceTagsRepo: Repository<GenreSourceTag>,
  ) {}

  searchArtists(source: Source, query: string, limit: number): Promise<SearchArtist[]> {
    const key = `artists:search:${source}:${query.toLowerCase().trim()}:${limit}`;
    return this.cache.getOrSet(key, TTL.search, () => {
      if (source === 'spotify') return this.spotify.searchArtists(query, limit);
      if (source === 'lastfm') return this.lastfm.searchArtists(query, limit);
      return this.mb.searchArtists(query, limit);
    });
  }

  async getArtist(source: Source, id: string): Promise<UnifiedArtist> {
    const key = `artists:detail:${source}:${id}`;
    return this.cache.getOrSet(key, TTL.detail, async () => {
      const artist = await this.rawArtist(source, id);
      if (!artist) throw new NotFoundException(`Artist '${id}' not found in ${source}`);
      artist.image = await this.resolveImage(source, id, artist);
      return artist;
    });
  }

  getAlbums(source: Source, id: string, limit: number): Promise<UnifiedAlbum[]> {
    const key = `artists:albums:${source}:${id}:${limit}`;
    return this.cache.getOrSet(key, TTL.albums, () => {
      if (source === 'spotify') return this.spotify.getAlbums(id, limit);
      if (source === 'lastfm') return this.lastfm.getAlbums(id, limit);
      return this.mb.getAlbums(id, limit);
    });
  }

  getTracks(source: Source, id: string, limit: number): Promise<UnifiedTrack[]> {
    const key = `artists:tracks:${source}:${id}:${limit}`;
    return this.cache.getOrSet(key, TTL.tracks, () => {
      if (source === 'spotify') return this.spotify.getTracks(id);
      if (source === 'lastfm') return this.lastfm.getTracks(id, limit);
      return this.mb.getTracks(id, limit);
    });
  }

  getImage(source: Source, id: string): Promise<{ image: string | null }> {
    const key = `artists:image:${source}:${id}`;
    return this.cache.getOrSet(key, TTL.image, async () => {
      if (source === 'spotify') return { image: await this.spotify.image(id) };
      const artist = await this.rawArtist(source, id);
      if (!artist) return { image: null };
      return { image: await this.resolveImage(source, id, artist) };
    });
  }

  async genreArtists(genreId: string, source: Source, limit: number): Promise<SearchArtist[]> {
    const tag = await this.resolveTag(genreId, source);
    const key = `genre:artists:${source}:${genreId}:${limit}`;
    return this.cache.getOrSet(key, TTL.genre, () => {
      if (source === 'spotify') return this.spotify.artistsByGenre(tag, limit);
      if (source === 'lastfm') return this.lastfm.artistsByTag(tag, limit);
      return this.mb.artistsByTag(tag, limit);
    });
  }

  async genreTracks(genreId: string, source: Source, limit: number): Promise<SimpleTrack[]> {
    const tag = await this.resolveTag(genreId, source);
    const key = `genre:tracks:${source}:${genreId}:${limit}`;
    return this.cache.getOrSet(key, TTL.genre, () => {
      if (source === 'spotify') return this.spotify.tracksByGenre(tag, limit);
      if (source === 'lastfm') return this.lastfm.tracksByTag(tag, limit);
      return this.mb.tracksByTag(tag, limit);
    });
  }

  // ---- helpers ----

  private rawArtist(source: Source, id: string): Promise<UnifiedArtist | null> {
    if (source === 'spotify') return this.spotify.getArtist(id);
    if (source === 'lastfm') return this.lastfm.getArtist(id);
    return this.mb.getArtist(id);
  }

  // Estrategia: AudioDB por MBID → AudioDB por nombre → fuente original → null.
  // Spotify usa su propia imagen.
  private async resolveImage(
    source: Source,
    id: string,
    artist: UnifiedArtist,
  ): Promise<string | null> {
    if (source === 'spotify') return artist.image ?? null;

    const hasMbid = source === 'musicbrainz' || !id.startsWith('name:');
    let img: string | null = null;
    if (hasMbid) img = await this.audiodb.imageByMBID(id);
    if (!img) img = await this.audiodb.imageByName(artist.name);
    if (!img) {
      img =
        source === 'musicbrainz'
          ? await this.mb.wikipediaImage(artist.name)
          : (artist.image ?? null); // imagen propia de Last.fm
    }
    return img ?? null;
  }

  // Resuelve el tag a usar por fuente: genre_source_tags si existe, si no el
  // nombre del género. Lanza 404 si el género no está en la BD.
  private async resolveTag(genreId: string, source: Source): Promise<string> {
    const mapped = await this.sourceTagsRepo.findOne({ where: { genreId, source } });
    if (mapped) return mapped.tag;
    const genre = await this.genresRepo.findOne({ where: { id: genreId } });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found`);
    return genre.name;
  }
}
