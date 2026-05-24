import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { GenreSourceTag } from './genre-source-tag.entity';

// Nota: la jerarquía es many-to-many (un género puede tener varios padres),
// vía la tabla genre_parents — distinta de genre_relations (afinidad).

@Entity({ name: 'genres' })
export class Genre {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index()
  @Column({ type: 'text', name: 'family_id' })
  familyId!: string;

  @ManyToOne(() => Family, (family) => family.genres, { nullable: false })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @Column({ type: 'text', nullable: true })
  era!: string | null;

  @Column({ type: 'text', nullable: true })
  region!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'genre_parents',
    joinColumn: { name: 'genre_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'parent_id', referencedColumnName: 'id' },
  })
  parents!: Genre[];

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'genre_relations',
    joinColumn: { name: 'genre_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'related_id', referencedColumnName: 'id' },
  })
  related!: Genre[];

  @OneToMany(() => GenreSourceTag, (tag) => tag.genre)
  sourceTags!: GenreSourceTag[];
}
