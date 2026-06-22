import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { EXTERNAL_SOURCES } from '../entities/genre-source-tag.entity';
import { Source } from '../proxy/types';

@Injectable()
export class ParseSourcePipe implements PipeTransform<unknown, Source> {
  transform(value: unknown): Source {
    if (typeof value === 'string' && (EXTERNAL_SOURCES as readonly string[]).includes(value)) {
      return value as Source;
    }
    throw new BadRequestException(`'source' debe ser uno de: ${EXTERNAL_SOURCES.join(', ')}`);
  }
}
