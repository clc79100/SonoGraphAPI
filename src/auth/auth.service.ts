import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({ email, passwordHash });
    await this.usersRepo.save(user);
    const tokens = await this.issueTokens(user.id);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
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
      // Reuse detection: si llega un refresh válido pero no es el guardado,
      // invalidamos toda la sesión del usuario.
      await this.redis.del(`refresh_token:${payload.sub}`);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.issueTokens(payload.sub);
  }

  async logout(userId: string, accessJti: string, accessExp: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, accessExp - now);
    if (remaining > 0) {
      await this.redis.setEx(`blacklist:${accessJti}`, remaining, '1');
    }
    await this.redis.del(`refresh_token:${userId}`);
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
