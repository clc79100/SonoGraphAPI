import { describe, it, expect } from 'vitest';
import {
  coverArtUrl,
  mapAlbums,
  mapArtist,
  mapSearchArtists,
  mapTracks,
  mapTracksByTag,
} from './musicbrainz.mappers';

describe('MusicbrainzMappers', () => {
  describe('coverArtUrl', () => {
    it('construye la URL de CoverArtArchive con tamaño por defecto 250', () => {
      // Arrange
      const rgId = 'rg-1';
      // Act
      const result = coverArtUrl(rgId);
      // Assert
      expect(result).toBe('https://coverartarchive.org/release-group/rg-1/front-250');
    });

    it('acepta el tamaño 500', () => {
      // Arrange
      const rgId = 'rg-1';
      // Act
      const result = coverArtUrl(rgId, 500);
      // Assert
      expect(result).toBe('https://coverartarchive.org/release-group/rg-1/front-500');
    });
  });

  describe('mapSearchArtists', () => {
    it('mapea artistas con país y desambiguación', () => {
      // Arrange
      const artists = [{ id: 'a1', name: 'Muse', country: 'GB', disambiguation: 'band' }];
      // Act
      const result = mapSearchArtists(artists);
      // Assert
      expect(result).toEqual([
        { id: 'a1', name: 'Muse', country: 'GB', disambiguation: 'band', source: 'musicbrainz' },
      ]);
    });
  });

  describe('mapArtist', () => {
    it('devuelve null cuando el artista no tiene id', () => {
      // Arrange
      const artist = { name: 'Sin id' };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result).toBeNull();
    });

    it('combina genres y tags en minúsculas sin duplicados', () => {
      // Arrange
      const artist = {
        id: 'a1',
        name: 'Radiohead',
        genres: [{ name: 'Rock' }],
        tags: [{ name: 'rock' }, { name: 'Alternative' }],
      };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result?.genres).toEqual(['rock', 'alternative']);
    });

    it('expone el externalUrl de MusicBrainz', () => {
      // Arrange
      const artist = { id: 'a1', name: 'Radiohead' };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result?.externalUrl).toBe('https://musicbrainz.org/artist/a1');
    });

    it('extrae area y fechas de life-span cuando existen', () => {
      // Arrange
      const artist = {
        id: 'a1',
        name: 'Radiohead',
        area: { name: 'Oxford' },
        'life-span': { begin: '1985', end: null },
      };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect({ area: result?.area, beginDate: result?.beginDate }).toEqual({
        area: 'Oxford',
        beginDate: '1985',
      });
    });

    it('devuelve géneros vacíos cuando no hay genres ni tags', () => {
      // Arrange
      const artist = { id: 'a1', name: 'Radiohead' };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result?.genres).toEqual([]);
    });
  });

  describe('mapAlbums', () => {
    it('ordena los álbumes por año ascendente', () => {
      // Arrange
      const rgs = [
        { id: 'b', title: 'B', 'first-release-date': '2003-01-01' },
        { id: 'a', title: 'A', 'first-release-date': '1997-05-21' },
      ];
      // Act
      const result = mapAlbums(rgs);
      // Assert
      expect(result.map((x) => x.year)).toEqual(['1997', '2003']);
    });

    it('usa la URL de CoverArtArchive como imagen', () => {
      // Arrange
      const rgs = [{ id: 'rg-1', title: 'OK Computer', 'first-release-date': '1997' }];
      // Act
      const result = mapAlbums(rgs);
      // Assert
      expect(result[0].imageUrl).toBe('https://coverartarchive.org/release-group/rg-1/front-250');
    });
  });

  describe('mapTracks', () => {
    it('mapea recordings con duración en ms', () => {
      // Arrange
      const recordings = [{ id: 'r1', title: 'Creep', length: 238000 }];
      // Act
      const result = mapTracks(recordings);
      // Assert
      expect(result[0]).toEqual({
        id: 'r1',
        title: 'Creep',
        duration: 238000,
        externalUrl: 'https://musicbrainz.org/recording/r1',
      });
    });

    it('deja la duración indefinida cuando no hay length', () => {
      // Arrange
      const recordings = [{ id: 'r1', title: 'Creep' }];
      // Act
      const result = mapTracks(recordings);
      // Assert
      expect(result[0].duration).toBeUndefined();
    });

    it('devuelve lista vacía cuando no hay recordings', () => {
      // Arrange
      const recordings: unknown[] = [];
      // Act
      const result = mapTracks(recordings);
      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('mapTracksByTag', () => {
    it('toma el artistName del primer artist-credit', () => {
      // Arrange
      const recordings = [
        { id: 'r1', title: 'Creep', 'artist-credit': [{ name: 'Radiohead' }], length: 238000 },
      ];
      // Act
      const result = mapTracksByTag(recordings);
      // Assert
      expect(result[0].artistName).toBe('Radiohead');
    });
  });
});
