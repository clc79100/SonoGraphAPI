import { Injectable, Logger } from '@nestjs/common';
import { envs } from '../config/envs';
import { RedisService } from '../redis/redis.service';
import {
  ProxyError,
  SearchArtist,
  SimpleTrack,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedTrack,
} from './types';

const ACCOUNTS_BASE = 'https://accounts.spotify.com';
const API_BASE = 'https://api.spotify.com/v1';
const TOKEN_KEY = 'spotify:token';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger('Spotify');

  constructor(private readonly redis: RedisService) {}

  private async getAccessToken(): Promise<string> {
    if (!envs.SPOTIFY_CLIENT_ID || !envs.SPOTIFY_CLIENT_SECRET) {
      throw new ProxyError(
        'no_credentials',
        'Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET',
      );
    }
    const cached = await this.redis.get(TOKEN_KEY);
    if (cached) return cached;

    const creds = Buffer.from(
      `${envs.SPOTIFY_CLIENT_ID}:${envs.SPOTIFY_CLIENT_SECRET}`,
    ).toString('base64');
    const res = await fetch(`${ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      throw new ProxyError('request_failed', `Spotify auth ${res.status}`);
    }
    const data = (await res.json()) as any;
    // El token expira a los 60s*expires_in; cachear 5s menos por seguridad.
    const ttl = Math.max(30, (data.expires_in ?? 3600) - 60);
    await this.redis.setEx(TOKEN_KEY, ttl, data.access_token);
    return data.access_token;
  }

  private async fetch<T>(path: string): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new ProxyError('request_failed', `Spotify ${res.status} ${path}`);
    }
    return (await res.json()) as T;
  }

  async searchArtists(query: string, limit = 10): Promise<SearchArtist[]> {
    const data = await this.fetch<any>(
      `/search?q=${encodeURIComponent(query.trim())}&type=artist&limit=${limit}`,
    );
    return (data?.artists?.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      source: 'spotify' as const,
    }));
  }

  async getArtist(id: string): Promise<UnifiedArtist | null> {
    const a = await this.fetch<any>(`/artists/${id}`);
    if (!a?.id) return null;
    return {
      id: a.id,
      name: a.name,
      genres: a.genres ?? [],
      image: a.images?.[0]?.url ?? null,
      externalUrl: a.external_urls?.spotify,
    };
  }

  async getAlbums(id: string, limit = 18): Promise<UnifiedAlbum[]> {
    const data = await this.fetch<any>(
      `/artists/${id}/albums?album_type=album&limit=${limit}&market=US`,
    );
    return (data?.items ?? []).map((a: any) => ({
      id: a.id,
      title: a.name,
      imageUrl: a.images?.[0]?.url,
      year: (a.release_date ?? '').slice(0, 4) || undefined,
      externalUrl: `https://open.spotify.com/album/${a.id}`,
    }));
  }

  async getTracks(id: string): Promise<UnifiedTrack[]> {
    const data = await this.fetch<any>(`/artists/${id}/top-tracks?market=US`);
    return (data?.tracks ?? []).map((t: any) => ({
      id: t.id,
      title: t.name,
      duration: t.duration_ms,
      album: t.album?.name,
      albumImageUrl: t.album?.images?.[0]?.url,
      externalUrl: `https://open.spotify.com/track/${t.id}`,
    }));
  }

  async image(id: string): Promise<string | null> {
    const a = await this.getArtist(id);
    return a?.image ?? null;
  }

  async artistsByGenre(genre: string, limit = 10): Promise<SearchArtist[]> {
    const data = await this.fetch<any>(
      `/search?q=${encodeURIComponent(genre)}&type=artist&limit=${limit}`,
    );
    return (data?.artists?.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      source: 'spotify' as const,
    }));
  }

  async tracksByGenre(genre: string, limit = 12): Promise<SimpleTrack[]> {
    const data = await this.fetch<any>(
      `/recommendations?seed_genres=${encodeURIComponent(genre)}&limit=${limit}&market=US`,
    );
    return (data?.tracks ?? []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artistName: t.artists?.[0]?.name,
      duration: t.duration_ms,
    }));
  }
}
