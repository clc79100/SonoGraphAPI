/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SearchArtist, SimpleTrack, UnifiedAlbum, UnifiedArtist, UnifiedTrack } from './types';
import {
  mapAlbums,
  mapArtist,
  mapSearchArtists,
  mapTracks,
  mapTracksByTag,
} from './musicbrainz.mappers';

const BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'Sonograph/1.0 ( https://github.com/sonograph )';
const MIN_INTERVAL_MS = 1100; // rate limit ~1 req/s

@Injectable()
export class MusicbrainzService {
  private chain: Promise<unknown> = Promise.resolve();
  private lastAt = 0;

  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  private schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      const wait = MIN_INTERVAL_MS - (Date.now() - this.lastAt);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastAt = Date.now();
      return fn();
    });
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private get<T>(path: string): Promise<T | null> {
    return this.schedule(async () => {
      const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      });
      if (!res.ok) {
        if (res.status === 503) {
          const retryAfter = res.headers.get('Retry-After');
          this.logger.warn(
            `MusicBrainz rate limited`,
            JSON.stringify({
              context: 'MusicbrainzService',
              meta: { retryAfterMs: retryAfter ? Number(retryAfter) * 1000 : null },
            }),
          );
        } else {
          this.logger.warn(
            `MusicBrainz non-OK response`,
            JSON.stringify({
              context: 'MusicbrainzService',
              meta: { status: res.status, path },
            }),
          );
        }
        return null;
      }
      return (await res.json()) as T;
    });
  }

  async searchArtists(query: string, limit = 10): Promise<SearchArtist[]> {
    const q = query.trim();
    if (!q) return [];
    const data = await this.get<any>(
      `/artist?query=${encodeURIComponent(q)}&fmt=json&limit=${limit}`,
    );
    return mapSearchArtists(data?.artists ?? []);
  }

  async getArtist(id: string): Promise<UnifiedArtist | null> {
    const a = await this.get<any>(`/artist/${id}?inc=genres+tags&fmt=json`);
    return mapArtist(a);
  }

  async getAlbums(id: string, limit = 16): Promise<UnifiedAlbum[]> {
    const data = await this.get<any>(
      `/release-group?artist=${id}&type=album&fmt=json&limit=${limit}`,
    );
    return mapAlbums(data?.['release-groups'] ?? []);
  }

  async getTracks(id: string, limit = 12): Promise<UnifiedTrack[]> {
    const data = await this.get<any>(`/recording?artist=${id}&fmt=json&limit=${limit}`);
    return mapTracks(data?.recordings ?? []);
  }

  async artistsByTag(tag: string, limit = 10): Promise<SearchArtist[]> {
    const q = `tag:"${tag.toLowerCase()}"`;
    const data = await this.get<any>(
      `/artist?query=${encodeURIComponent(q)}&fmt=json&limit=${limit}`,
    );
    return mapSearchArtists(data?.artists ?? []);
  }

  async tracksByTag(tag: string, limit = 12): Promise<SimpleTrack[]> {
    const q = `tag:"${tag.toLowerCase()}"`;
    const data = await this.get<any>(
      `/recording?query=${encodeURIComponent(q)}&fmt=json&limit=${limit}`,
    );
    return mapTracksByTag(data?.recordings ?? []);
  }

  async wikipediaImage(name: string): Promise<string | null> {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return data.thumbnail?.source ?? data.originalimage?.source ?? null;
    } catch {
      return null;
    }
  }
}
