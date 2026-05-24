import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ExternalSource, SOURCE_CHECK } from './genre-source-tag.entity';

@Entity({ name: 'favorite_albums' })
@Unique(['userId', 'externalId', 'source'])
@Check(SOURCE_CHECK)
export class FavoriteAlbum {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'text', name: 'external_id' })
  externalId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', name: 'artist_name', nullable: true })
  artistName!: string | null;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text' })
  source!: ExternalSource;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
