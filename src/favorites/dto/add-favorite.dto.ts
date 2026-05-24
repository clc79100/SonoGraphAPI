import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { EXTERNAL_SOURCES, ExternalSource } from '../../entities/genre-source-tag.entity';

class BaseFavoriteDto {
  @IsString()
  @MinLength(1)
  externalId!: string;

  @IsIn(EXTERNAL_SOURCES as unknown as string[])
  source!: ExternalSource;
}

export class AddFavoriteArtistDto extends BaseFavoriteDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class AddFavoriteTrackDto extends BaseFavoriteDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  artistName?: string;
}

export class AddFavoriteAlbumDto extends BaseFavoriteDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  artistName?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
