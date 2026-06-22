/* eslint-disable @typescript-eslint/no-explicit-any */
// Funciones puras de mapeo/normalización de Last.fm → tipos Unified*.
// Extraídas de LastfmService para poder testearlas en aislamiento (sin HTTP).
import { SearchArtist, SimpleTrack, UnifiedAlbum, UnifiedArtist, UnifiedTrack } from './types';

export const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';

export interface LFMImage {
  '#text': string;
  size: string;
}

// Last.fm identifica por mbid si existe, si no por `name:<artista>`.
export function idToParam(id: string): Record<string, string> {
  return id.startsWith('name:') ? { artist: id.slice(5) } : { mbid: id };
}

// Elige la mejor imagen disponible y filtra el placeholder de Last.fm.
export function pickImage(images?: LFMImage[]): string | null {
  if (!images?.length) return null;
  for (const size of ['mega', 'extralarge', 'large', 'medium', 'small']) {
    const found = images.find((i) => i.size === size && i['#text']);
    if (found && !found['#text'].includes(LASTFM_PLACEHOLDER)) return found['#text'];
  }
  return null;
}

export function mapSearchArtists(matches: any[]): SearchArtist[] {
  return (matches ?? []).map((a: any) => ({
    id: a.mbid || `name:${a.name}`,
    name: a.name,
    source: 'lastfm' as const,
  }));
}

export function mapArtist(a: any): UnifiedArtist | null {
  if (!a) return null;
  return {
    id: a.mbid || `name:${a.name}`,
    name: a.name,
    genres: a.tags?.tag?.map((t: any) => t.name) ?? [],
    image: pickImage(a.image),
    externalUrl: a.url,
  };
}

export function mapAlbums(albums: any[]): UnifiedAlbum[] {
  return (albums ?? []).map((a: any) => ({
    id: a.mbid || `name:${a.artist?.name}|${a.name}`,
    title: a.name,
    imageUrl: pickImage(a.image) ?? undefined,
    externalUrl: a.url,
  }));
}

export function mapTracks(tracks: any[]): UnifiedTrack[] {
  return (tracks ?? []).map((t: any) => ({
    id: t.mbid || `name:${t.artist?.name}|${t.name}`,
    title: t.name,
    duration: t.duration ? Number(t.duration) * 1000 : undefined,
    albumImageUrl: pickImage(t.image) ?? undefined,
    externalUrl: t.url,
  }));
}

export function mapArtistsByTag(artists: any[]): SearchArtist[] {
  return (artists ?? []).map((a: any) => ({
    id: a.mbid || `name:${a.name}`,
    name: a.name,
    source: 'lastfm' as const,
  }));
}

export function mapTracksByTag(tracks: any[]): SimpleTrack[] {
  return (tracks ?? []).map((t: any) => ({
    id: t.mbid || `name:${t.artist?.name}|${t.name}`,
    title: t.name,
    artistName: t.artist?.name,
    duration: t.duration ? Number(t.duration) * 1000 : undefined,
  }));
}
