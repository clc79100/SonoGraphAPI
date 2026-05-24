import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'genre_visits' })
export class GenreVisit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'text', name: 'genre_id' })
  genreId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'visited_at' })
  visitedAt!: Date;
}
