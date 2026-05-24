import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Genre } from './genre.entity';

export const EXTERNAL_SOURCES = ['musicbrainz', 'spotify', 'lastfm'] as const;
export type ExternalSource = (typeof EXTERNAL_SOURCES)[number];

export const SOURCE_CHECK = `source IN ('musicbrainz', 'spotify', 'lastfm')`;

@Entity({ name: 'genre_source_tags' })
@Check(SOURCE_CHECK)
export class GenreSourceTag {
  @PrimaryColumn({ type: 'text', name: 'genre_id' })
  genreId!: string;

  @PrimaryColumn({ type: 'text' })
  source!: ExternalSource;

  @Column({ type: 'text' })
  tag!: string;

  @ManyToOne(() => Genre, (genre) => genre.sourceTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre!: Genre;
}
