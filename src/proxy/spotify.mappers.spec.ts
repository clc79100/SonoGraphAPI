import { describe, it, expect } from 'vitest';
import {
  mapAlbums,
  mapArtist,
  mapSearchArtists,
  mapTracks,
  mapTracksByGenre,
} from './spotify.mappers';

describe('SpotifyMappers', () => {
  describe('mapSearchArtists', () => {
    it('mapea items con source spotify', () => {
      // Arrange
      const items = [{ id: 's1', name: 'Muse' }];
      // Act
      const result = mapSearchArtists(items);
      // Assert
      expect(result).toEqual([{ id: 's1', name: 'Muse', source: 'spotify' }]);
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

    it('toma la primera imagen y el género tal cual', () => {
      // Arrange
      const artist = {
        id: 's1',
        name: 'Radiohead',
        genres: ['alternative rock'],
        images: [{ url: 'https://spotify/img.png' }],
        external_urls: { spotify: 'https://open.spotify.com/artist/s1' },
      };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result).toEqual({
        id: 's1',
        name: 'Radiohead',
        genres: ['alternative rock'],
        image: 'https://spotify/img.png',
        externalUrl: 'https://open.spotify.com/artist/s1',
      });
    });

    it('devuelve image null cuando no hay imágenes', () => {
      // Arrange
      const artist = { id: 's1', name: 'Radiohead' };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result?.image).toBeNull();
    });
  });

  describe('mapAlbums', () => {
    it('extrae el año de release_date', () => {
      // Arrange
      const items = [{ id: 'al1', name: 'OK Computer', release_date: '1997-05-21', images: [] }];
      // Act
      const result = mapAlbums(items);
      // Assert
      expect(result[0].year).toBe('1997');
    });

    it('deja año e imagen indefinidos cuando faltan', () => {
      // Arrange
      const items = [{ id: 'al1', name: 'Sin datos' }];
      // Act
      const result = mapAlbums(items);
      // Assert
      expect({ year: result[0].year, imageUrl: result[0].imageUrl }).toEqual({
        year: undefined,
        imageUrl: undefined,
      });
    });
  });

  describe('mapTracks', () => {
    it('mapea top tracks con duración en ms y álbum', () => {
      // Arrange
      const tracks = [
        {
          id: 't1',
          name: 'Creep',
          duration_ms: 238000,
          album: { name: 'Pablo Honey', images: [{ url: 'https://spotify/al.png' }] },
        },
      ];
      // Act
      const result = mapTracks(tracks);
      // Assert
      expect(result[0]).toEqual({
        id: 't1',
        title: 'Creep',
        duration: 238000,
        album: 'Pablo Honey',
        albumImageUrl: 'https://spotify/al.png',
        externalUrl: 'https://open.spotify.com/track/t1',
      });
    });

    it('deja álbum e imagen indefinidos cuando el track no trae álbum', () => {
      // Arrange
      const tracks = [{ id: 't1', name: 'Creep', duration_ms: 238000 }];
      // Act
      const result = mapTracks(tracks);
      // Assert
      expect({ album: result[0].album, albumImageUrl: result[0].albumImageUrl }).toEqual({
        album: undefined,
        albumImageUrl: undefined,
      });
    });
  });

  describe('mapTracksByGenre', () => {
    it('toma el artistName del primer artista', () => {
      // Arrange
      const tracks = [
        { id: 't1', name: 'Creep', artists: [{ name: 'Radiohead' }], duration_ms: 238000 },
      ];
      // Act
      const result = mapTracksByGenre(tracks);
      // Assert
      expect(result[0]).toEqual({
        id: 't1',
        title: 'Creep',
        artistName: 'Radiohead',
        duration: 238000,
      });
    });
  });
});
