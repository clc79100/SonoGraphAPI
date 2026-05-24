import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VisitsService } from './visits.service';

@UseGuards(JwtAuthGuard)
@Controller('users/me/genre-visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(':genreId')
  record(@CurrentUser() user: AuthenticatedUser, @Param('genreId') genreId: string) {
    return this.visits.record(user.userId, genreId);
  }

  @Get('recent')
  recent(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.visits.recent(user.userId, limit);
  }

  @Get('top')
  top(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.visits.top(user.userId, limit);
  }
}
