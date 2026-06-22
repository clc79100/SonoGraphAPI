import { ExternalSource } from '../entities/genre-source-tag.entity';

export type Source = ExternalSource;

// Contrato unificado consumido por el frontend (no modificar las formas).
export interface UnifiedArtist {
  id: string;
  name: string;
  genres: string[];
  image?: string | null;
  country?: string;
  disambiguation?: string;
  type?: string;
  area?: string;
  beginDate?: string;
  endDate?: string;
  externalUrl?: string;
}

export interface UnifiedAlbum {
  id: string;
  title: string;
  imageUrl?: string;
  year?: string;
  externalUrl?: string;
}

export interface UnifiedTrack {
  id: string;
  title: string;
  duration?: number; // ms
  album?: string;
  albumImageUrl?: string;
  externalUrl?: string;
}

export interface SearchArtist {
  id: string;
  name: string;
  country?: string;
  disambiguation?: string;
  source: Source;
}

export interface SimpleTrack {
  id: string;
  title: string;
  artistName?: string;
  duration?: number; // ms
}

export type ProxyErrorCode = 'no_credentials' | 'premium_required' | 'request_failed' | 'not_found';

export class ProxyError extends Error {
  constructor(
    public readonly code: ProxyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}
