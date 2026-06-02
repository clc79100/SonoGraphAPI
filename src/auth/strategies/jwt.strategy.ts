import { Inject, Injectable, LoggerService, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { envs } from '../../config/envs';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  jti: string;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly redis: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const blocked = await this.redis.exists(`blacklist:${payload.jti}`);
    if (blocked) {
      this.logger.warn(`Revoked token used: ${payload.jti}`, 'JwtStrategy');
      throw new UnauthorizedException('Token revoked');
    }
    return { userId: payload.sub, jti: payload.jti, exp: payload.exp };
  }
}
