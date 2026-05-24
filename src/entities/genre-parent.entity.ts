import { Check, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Genre } from './genre.entity';

@Entity({ name: 'genre_parents' })
@Check(`"genre_id" <> "parent_id"`)
export class GenreParent {
  @PrimaryColumn({ type: 'text', name: 'genre_id' })
  genreId!: string;

  @PrimaryColumn({ type: 'text', name: 'parent_id' })
  parentId!: string;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre!: Genre;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent!: Genre;
}
