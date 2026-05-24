import { Check, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Genre } from './genre.entity';

@Entity({ name: 'genre_relations' })
@Check(`"genre_id" <> "related_id"`)
export class GenreRelation {
  @PrimaryColumn({ type: 'text', name: 'genre_id' })
  genreId!: string;

  @PrimaryColumn({ type: 'text', name: 'related_id' })
  relatedId!: string;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre!: Genre;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'related_id' })
  related!: Genre;
}
