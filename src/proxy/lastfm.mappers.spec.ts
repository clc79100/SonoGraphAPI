import { describe, it, expect } from 'vitest';
import {
  LASTFM_PLACEHOLDER,
  idToParam,
  mapAlbums,
  mapArtist,
  mapArtistsByTag,
  mapSearchArtists,
  mapTracks,
  mapTracksByTag,
  pickImage,
} from './lastfm.mappers';

describe('LastfmMappers', () => {
  describe('idToParam', () => {
    it('usa el nombre cuando el id tiene el prefijo name:', () => {
      // Arrange
      const id = 'name:Radiohead';
      // Act
      const result = idToParam(id);
      // Assert
      expect(result).toEqual({ artist: 'Radiohead' });
    });

    it('usa el mbid cuando el id no tiene prefijo', () => {
      // Arrange
      const id = 'a74b1b7f-71a5-4011-9441-d0b5e4122711';
      // Act
      const result = idToParam(id);
      // Assert
      expect(result).toEqual({ mbid: 'a74b1b7f-71a5-4011-9441-d0b5e4122711' });
    });
  });

  describe('pickImage', () => {
    it('devuelve null cuando no hay imágenes', () => {
      // Arrange
      const images = undefined;
      // Act
      const result = pickImage(images);
      // Assert
      expect(result).toBeNull();
    });

    it('filtra el placeholder de Last.fm y devuelve null', () => {
      // Arrange
      const images = [{ size: 'large', '#text': `https://lastfm/${LASTFM_PLACEHOLDER}.png` }];
      // Act
      const result = pickImage(images);
      // Assert
      expect(result).toBeNull();
    });

    it('elige el tamaño de mayor prioridad disponible', () => {
      // Arrange
      const images = [
        { size: 'small', '#text': 'https://lastfm/small.png' },
        { size: 'mega', '#text': 'https://lastfm/mega.png' },
      ];
      // Act
      const result = pickImage(images);
      // Assert
      expect(result).toBe('https://lastfm/mega.png');
    });

    it('cae al tamaño small cuando es el único disponible', () => {
      // Arrange
      const images = [{ size: 'small', '#text': 'https://lastfm/small.png' }];
      // Act
      const result = pickImage(images);
      // Assert
      expect(result).toBe('https://lastfm/small.png');
    });
  });

  describe('mapSearchArtists', () => {
    it('mapea matches usando mbid cuando existe', () => {
      // Arrange
      const matches = [{ mbid: 'mbid-1', name: 'Muse' }];
      // Act
      const result = mapSearchArtists(matches);
      // Assert
      expect(result).toEqual([{ id: 'mbid-1', name: 'Muse', source: 'lastfm' }]);
    });

    it('genera id name:<nombre> cuando falta el mbid', () => {
      // Arrange
      const matches = [{ name: 'Muse' }];
      // Act
      const result = mapSearchArtists(matches);
      // Assert
      expect(result[0].id).toBe('name:Muse');
    });
  });

  describe('mapArtist', () => {
    it('devuelve null cuando no hay artista', () => {
      // Arrange
      const artist = undefined;
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result).toBeNull();
    });

    it('normaliza géneros desde tags y resuelve la imagen', () => {
      // Arrange
      const artist = {
        mbid: 'mbid-1',
        name: 'Radiohead',
        tags: { tag: [{ name: 'alternative' }, { name: 'rock' }] },
        image: [{ size: 'large', '#text': 'https://lastfm/large.png' }],
        url: 'https://last.fm/music/Radiohead',
      };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result).toEqual({
        id: 'mbid-1',
        name: 'Radiohead',
        genres: ['alternative', 'rock'],
        image: 'https://lastfm/large.png',
        externalUrl: 'https://last.fm/music/Radiohead',
      });
    });

    it('devuelve géneros vacíos cuando no hay tags', () => {
      // Arrange
      const artist = { name: 'Unknown' };
      // Act
      const result = mapArtist(artist);
      // Assert
      expect(result?.genres).toEqual([]);
    });
  });

  describe('mapAlbums', () => {
    it('genera id compuesto cuando no hay mbid', () => {
      // Arrange
      const albums = [{ name: 'OK Computer', artist: { name: 'Radiohead' }, image: [] }];
      // Act
      const result = mapAlbums(albums);
      // Assert
      expect(result[0].id).toBe('name:Radiohead|OK Computer');
    });
  });

  describe('mapTracks', () => {
    it('convierte la duración de segundos a milisegundos', () => {
      // Arrange
      const tracks = [{ mbid: 't1', name: 'Creep', duration: '238', image: [] }];
      // Act
      const result = mapTracks(tracks);
      // Assert
      expect(result[0].duration).toBe(238000);
    });

    it('deja la duración indefinida cuando no viene', () => {
      // Arrange
      const tracks = [{ mbid: 't1', name: 'Creep', image: [] }];
      // Act
      const result = mapTracks(tracks);
      // Assert
      expect(result[0].duration).toBeUndefined();
    });
  });

  describe('mapArtistsByTag', () => {
    it('mapea artistas por tag con source lastfm', () => {
      // Arrange
      const artists = [{ mbid: 'mbid-1', name: 'Muse' }];
      // Act
      const result = mapArtistsByTag(artists);
      // Assert
      expect(result).toEqual([{ id: 'mbid-1', name: 'Muse', source: 'lastfm' }]);
    });
  });

  describe('mapTracksByTag', () => {
    it('incluye artistName y duración en ms', () => {
      // Arrange
      const tracks = [{ name: 'Creep', artist: { name: 'Radiohead' }, duration: '238' }];
      // Act
      const result = mapTracksByTag(tracks);
      // Assert
      expect(result[0]).toEqual({
        id: 'name:Radiohead|Creep',
        title: 'Creep',
        artistName: 'Radiohead',
        duration: 238000,
      });
    });
  });
});
