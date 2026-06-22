/* eslint-disable @typescript-eslint/no-explicit-any */
// Funciones puras de mapeo/normalización de MusicBrainz → tipos Unified*.
// Extraídas de MusicbrainzService para testearlas en aislamiento (sin HTTP).
import { SearchArtist, SimpleTrack, UnifiedAlbum, UnifiedArtist, UnifiedTrack } from './types';

export function coverArtUrl(releaseGroupId: string, size: 250 | 500 = 250): string {
  return `https://coverartarchive.org/release-group/${releaseGroupId}/front-${size}`;
}

export function mapSearchArtists(artists: any[]): SearchArtist[] {
  return (artists ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    country: a.country,
    disambiguation: a.disambiguation,
    source: 'musicbrainz' as const,
  }));
}

export function mapArtist(a: any): UnifiedArtist | null {
  if (!a?.id) return null;
  const genres = new Set<string>();
  (a.genres ?? []).forEach((g: any) => g?.name && genres.add(String(g.name).toLowerCase()));
  (a.tags ?? []).forEach((t: any) => t?.name && genres.add(String(t.name).toLowerCase()));
  return {
    id: a.id,
    name: a.name,
    genres: [...genres],
    country: a.country,
    disambiguation: a.disambiguation,
    type: a.type,
    area: a.area?.name,
    beginDate: a['life-span']?.begin,
    endDate: a['life-span']?.end,
    externalUrl: `https://musicbrainz.org/artist/${a.id}`,
  };
}

export function mapAlbums(releaseGroups: any[]): UnifiedAlbum[] {
  const list: UnifiedAlbum[] = (releaseGroups ?? []).map((rg: any) => ({
    id: rg.id,
    title: rg.title,
    imageUrl: coverArtUrl(rg.id),
    year: rg['first-release-date']?.slice(0, 4) || undefined,
    externalUrl: `https://musicbrainz.org/release-group/${rg.id}`,
  }));
  return list.sort((a, b) => (a.year ?? '').localeCompare(b.year ?? ''));
}

export function mapTracks(recordings: any[]): UnifiedTrack[] {
  return (recordings ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    duration: r.length ?? undefined,
    externalUrl: `https://musicbrainz.org/recording/${r.id}`,
  }));
}

export function mapTracksByTag(recordings: any[]): SimpleTrack[] {
  return (recordings ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    artistName: r['artist-credit']?.[0]?.name,
    duration: r.length ?? undefined,
  }));
}
