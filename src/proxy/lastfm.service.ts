/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { envs } from '../config/envs';
import {
  ProxyError,
  SearchArtist,
  SimpleTrack,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedTrack,
} from './types';
import {
  idToParam,
  mapAlbums,
  mapArtist,
  mapArtistsByTag,
  mapSearchArtists,
  mapTracks,
  mapTracksByTag,
} from './lastfm.mappers';

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

@Injectable()
export class LastfmService {
  private async call<T>(params: Record<string, string>): Promise<T> {
    if (!envs.LASTFM_API_KEY) {
      throw new ProxyError('no_credentials', 'Falta LASTFM_API_KEY');
    }
    const qs = new URLSearchParams({
      ...params,
      api_key: envs.LASTFM_API_KEY,
      format: 'json',
    });
    const res = await fetch(`${API_BASE}?${qs.toString()}`);
    if (!res.ok) {
      throw new ProxyError('request_failed', `Last.fm ${res.status} ${params.method}`);
    }
    const data = (await res.json()) as any;
    if (data?.error) {
      if (data.error === 6) throw new ProxyError('not_found', data.message ?? 'No encontrado');
      throw new ProxyError('request_failed', data.message ?? 'Error Last.fm');
    }
    return data as T;
  }

  async searchArtists(query: string, limit = 10): Promise<SearchArtist[]> {
    const data = await this.call<any>({
      method: 'artist.search',
      artist: query.trim(),
      limit: String(limit),
    });
    return mapSearchArtists(data?.results?.artistmatches?.artist ?? []);
  }

  async getArtist(id: string): Promise<UnifiedArtist | null> {
    try {
      const data = await this.call<any>({
        method: 'artist.getinfo',
        ...idToParam(id),
        autocorrect: '1',
      });
      return mapArtist(data?.artist);
    } catch (err) {
      if (err instanceof ProxyError && err.code === 'not_found') return null;
      throw err;
    }
  }

  async getAlbums(id: string, limit = 18): Promise<UnifiedAlbum[]> {
    const data = await this.call<any>({
      method: 'artist.gettopalbums',
      ...idToParam(id),
      autocorrect: '1',
      limit: String(limit),
    });
    return mapAlbums(data?.topalbums?.album ?? []);
  }

  async getTracks(id: string, limit = 12): Promise<UnifiedTrack[]> {
    const data = await this.call<any>({
      method: 'artist.gettoptracks',
      ...idToParam(id),
      autocorrect: '1',
      limit: String(limit),
    });
    return mapTracks(data?.toptracks?.track ?? []);
  }

  async image(id: string): Promise<string | null> {
    const a = await this.getArtist(id);
    return a?.image ?? null;
  }

  async artistsByTag(tag: string, limit = 10): Promise<SearchArtist[]> {
    const data = await this.call<any>({
      method: 'tag.gettopartists',
      tag,
      limit: String(limit),
    });
    return mapArtistsByTag(data?.topartists?.artist ?? []);
  }

  async tracksByTag(tag: string, limit = 12): Promise<SimpleTrack[]> {
    const data = await this.call<any>({
      method: 'tag.gettoptracks',
      tag,
      limit: String(limit),
    });
    return mapTracksByTag(data?.tracks?.track ?? []);
  }
}
