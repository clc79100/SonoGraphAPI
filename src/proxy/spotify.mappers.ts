/* eslint-disable @typescript-eslint/no-explicit-any */
// Funciones puras de mapeo/normalización de Spotify → tipos Unified*.
// Extraídas de SpotifyService para testearlas en aislamiento (sin HTTP).
import { SearchArtist, SimpleTrack, UnifiedAlbum, UnifiedArtist, UnifiedTrack } from './types';

export function mapSearchArtists(items: any[]): SearchArtist[] {
  return (items ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    source: 'spotify' as const,
  }));
}

export function mapArtist(a: any): UnifiedArtist | null {
  if (!a?.id) return null;
  return {
    id: a.id,
    name: a.name,
    genres: a.genres ?? [],
    image: a.images?.[0]?.url ?? null,
    externalUrl: a.external_urls?.spotify,
  };
}

export function mapAlbums(items: any[]): UnifiedAlbum[] {
  return (items ?? []).map((a: any) => ({
    id: a.id,
    title: a.name,
    imageUrl: a.images?.[0]?.url,
    year: (a.release_date ?? '').slice(0, 4) || undefined,
    externalUrl: `https://open.spotify.com/album/${a.id}`,
  }));
}

export function mapTracks(tracks: any[]): UnifiedTrack[] {
  return (tracks ?? []).map((t: any) => ({
    id: t.id,
    title: t.name,
    duration: t.duration_ms,
    album: t.album?.name,
    albumImageUrl: t.album?.images?.[0]?.url,
    externalUrl: `https://open.spotify.com/track/${t.id}`,
  }));
}

export function mapTracksByGenre(tracks: any[]): SimpleTrack[] {
  return (tracks ?? []).map((t: any) => ({
    id: t.id,
    title: t.name,
    artistName: t.artists?.[0]?.name,
    duration: t.duration_ms,
  }));
}
