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

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';

interface LFMImage {
  '#text': string;
  size: string;
}

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

  // Last.fm identifica por mbid si existe, si no por `name:<artista>`.
  private idToParam(id: string): Record<string, string> {
    return id.startsWith('name:') ? { artist: id.slice(5) } : { mbid: id };
  }

  private pickImage(images?: LFMImage[]): string | null {
    if (!images?.length) return null;
    for (const size of ['mega', 'extralarge', 'large', 'medium', 'small']) {
      const found = images.find((i) => i.size === size && i['#text']);
      if (found && !found['#text'].includes(PLACEHOLDER)) return found['#text'];
    }
    return null;
  }

  async searchArtists(query: string, limit = 10): Promise<SearchArtist[]> {
    const data = await this.call<any>({
      method: 'artist.search',
      artist: query.trim(),
      limit: String(limit),
    });
    const matches = data?.results?.artistmatches?.artist ?? [];
    return matches.map((a: any) => ({
      id: a.mbid || `name:${a.name}`,
      name: a.name,
      source: 'lastfm' as const,
    }));
  }

  async getArtist(id: string): Promise<UnifiedArtist | null> {
    try {
      const data = await this.call<any>({
        method: 'artist.getinfo',
        ...this.idToParam(id),
        autocorrect: '1',
      });
      const a = data?.artist;
      if (!a) return null;
      return {
        id: a.mbid || `name:${a.name}`,
        name: a.name,
        genres: a.tags?.tag?.map((t: any) => t.name) ?? [],
        image: this.pickImage(a.image),
        externalUrl: a.url,
      };
    } catch (err) {
      if (err instanceof ProxyError && err.code === 'not_found') return null;
      throw err;
    }
  }

  async getAlbums(id: string, limit = 18): Promise<UnifiedAlbum[]> {
    const data = await this.call<any>({
      method: 'artist.gettopalbums',
      ...this.idToParam(id),
      autocorrect: '1',
      limit: String(limit),
    });
    return (data?.topalbums?.album ?? []).map((a: any) => ({
      id: a.mbid || `name:${a.artist?.name}|${a.name}`,
      title: a.name,
      imageUrl: this.pickImage(a.image) ?? undefined,
      externalUrl: a.url,
    }));
  }

  async getTracks(id: string, limit = 12): Promise<UnifiedTrack[]> {
    const data = await this.call<any>({
      method: 'artist.gettoptracks',
      ...this.idToParam(id),
      autocorrect: '1',
      limit: String(limit),
    });
    return (data?.toptracks?.track ?? []).map((t: any) => ({
      id: t.mbid || `name:${t.artist?.name}|${t.name}`,
      title: t.name,
      duration: t.duration ? Number(t.duration) * 1000 : undefined,
      albumImageUrl: this.pickImage(t.image) ?? undefined,
      externalUrl: t.url,
    }));
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
    return (data?.topartists?.artist ?? []).map((a: any) => ({
      id: a.mbid || `name:${a.name}`,
      name: a.name,
      source: 'lastfm' as const,
    }));
  }

  async tracksByTag(tag: string, limit = 12): Promise<SimpleTrack[]> {
    const data = await this.call<any>({
      method: 'tag.gettoptracks',
      tag,
      limit: String(limit),
    });
    return (data?.tracks?.track ?? []).map((t: any) => ({
      id: t.mbid || `name:${t.artist?.name}|${t.name}`,
      title: t.name,
      artistName: t.artist?.name,
      duration: t.duration ? Number(t.duration) * 1000 : undefined,
    }));
  }
}
