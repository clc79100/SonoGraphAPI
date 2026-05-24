import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Genre } from './genre.entity';

@Entity({ name: 'families' })
export class Family {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @OneToMany(() => Genre, (genre) => genre.family)
  genres!: Genre[];
}
