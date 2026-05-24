import { Injectable } from '@nestjs/common';

const BASE = 'https://www.theaudiodb.com/api/v1/json/123';

@Injectable()
export class AudiodbService {
  async imageByMBID(mbid: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE}/artist-mb.php?i=${encodeURIComponent(mbid)}`);
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return (data?.artists?.[0]?.strArtistThumb as string) ?? null;
    } catch {
      return null;
    }
  }

  async imageByName(name: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(name.trim())}`);
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return (data?.artists?.[0]?.strArtistThumb as string) ?? null;
    } catch {
      return null;
    }
  }
}
