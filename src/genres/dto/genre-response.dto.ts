import { ExternalSource } from '../../entities/genre-source-tag.entity';

export interface FamilyResponse {
  id: string;
  name: string;
}

export type SourceTagsResponse = Partial<Record<ExternalSource, string>>;

export interface GenreResponse {
  id: string;
  name: string;
  family: string;
  parents: string[];
  related: string[];
  era?: string;
  region?: string;
  description?: string;
  sourceTags?: SourceTagsResponse;
}
