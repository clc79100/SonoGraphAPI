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

@Entity({ name: 'favorite_artists' })
@Unique(['userId', 'externalId', 'source'])
@Check(SOURCE_CHECK)
export class FavoriteArtist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'text', name: 'external_id' })
  externalId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text' })
  source!: ExternalSource;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
