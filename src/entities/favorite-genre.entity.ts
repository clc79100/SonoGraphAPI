import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'favorite_genres' })
export class FavoriteGenre {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @PrimaryColumn({ type: 'text', name: 'genre_id' })
  genreId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
