import {
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { envs } from '../config/envs';
import { User } from '../entities/user.entity';
import { RedisService } from '../redis/redis.service';

const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: { id: string; email: string };
}

interface RefreshPayload {
  sub: string;
  jti: string;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly accessTtl = envs.JWT_ACCESS_TTL;
  private readonly refreshTtl = envs.JWT_REFRESH_TTL;
  private readonly refreshSecret = envs.JWT_REFRESH_SECRET;

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({ email, passwordHash });
    await this.usersRepo.save(user);
    this.logger.log(`Register: ${user.id}`, 'AuthService');
    const tokens = await this.issueTokens(user.id);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      this.logger.warn('Login failed: user not found', 'AuthService');
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      this.logger.warn(`Login failed: wrong password for ${user.id}`, 'AuthService');
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`Login: ${user.id}`, 'AuthService');
    const tokens = await this.issueTokens(user.id);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.redis.get(`refresh_token:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      await this.redis.del(`refresh_token:${payload.sub}`);
      this.logger.warn(`Refresh token reuse detected: ${payload.sub}`, 'AuthService');
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    this.logger.log(`Token refreshed: ${payload.sub}`, 'AuthService');
    return this.issueTokens(payload.sub);
  }

  async logout(userId: string, accessJti: string, accessExp: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, accessExp - now);
    if (remaining > 0) {
      await this.redis.setEx(`blacklist:${accessJti}`, remaining, '1');
    }
    await this.redis.del(`refresh_token:${userId}`);
    this.logger.log(`Logout: ${userId}`, 'AuthService');
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = await this.jwt.signAsync(
      { sub: userId, jti: accessJti },
      { expiresIn: this.accessTtl },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: refreshJti },
      { secret: this.refreshSecret, expiresIn: this.refreshTtl },
    );

    await this.redis.setEx(`refresh_token:${userId}`, this.refreshTtl, refreshToken);
    return { accessToken, refreshToken };
  }
}
