import type { WithResponse } from '@/utils/types';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import type { StringValue } from 'ms';
import ms from 'ms';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import type { AuthConfig, LoginDto, WithRefreshToken } from './types';

@Injectable()
export class AuthService {
  private readonly config: AuthConfig;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.config = {
      jwtAccessSecret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'AT_SECRET',
      ),
      jwtRefreshSecret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'RT_SECRET',
      ),
      jwtAccessExpiration: this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ),
      jwtRefreshExpiration: this.configService.get<string>(
        'JWT_REFRESH_EXPIRATION',
        '7d',
      ),
      bcryptSaltRounds: parseInt(
        this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
      ),
      refreshTokenCookieKey: this.configService.get<string>(
        'REFRESH_TOKEN_COOKIE_KEY',
        'refreshToken',
      ),
    };
  }

  async getTokens(userId: User['id']) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtAccessSecret,
        expiresIn: this.config
          .jwtAccessExpiration as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtRefreshSecret,
        expiresIn: this.config
          .jwtRefreshExpiration as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async login({ nationalId, password, response }: WithResponse<LoginDto>) {
    const user = (await this.usersRepository.findOne({
      where: { nationalId },
      select: ['id', 'passwordHash', 'isTempPassword'],
    })) as Pick<User, 'id' | 'passwordHash' | 'isTempPassword'> | null;

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const arePasswordsMatch = await bcrypt.compare(password, user.passwordHash);

    if (!arePasswordsMatch)
      throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.getTokens(user.id);
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.config.bcryptSaltRounds,
    );

    await this.usersRepository.update(user.id, { hashedRefreshToken });

    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return { ...tokens, isTempPassword: user.isTempPassword };
  }

  async logout({ id, response }: WithResponse<Pick<User, 'id'>>) {
    await this.usersRepository.update(id, { hashedRefreshToken: null });

    this.clearRefreshTokenCookie(response);

    return { success: true };
  }

  async refreshTokens({
    id,
    refreshToken,
    response,
  }: WithResponse<WithRefreshToken<Pick<User, 'id'>>>) {
    const user = (await this.usersRepository.findOne({
      where: { id },
      select: ['hashedRefreshToken'],
    })) as Pick<User, 'hashedRefreshToken'> | null;

    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const areRefreshTokensMatch = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!areRefreshTokensMatch) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(id);
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.config.bcryptSaltRounds,
    );

    await this.usersRepository.update(id, { hashedRefreshToken });

    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return tokens;
  }

  private setRefreshTokenCookie = (response: Response, refreshToken: string) =>
    response.cookie(this.config.refreshTokenCookieKey, refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: ms(this.config.jwtRefreshExpiration as StringValue),
    });

  private clearRefreshTokenCookie = (response: Response) =>
    response.clearCookie(this.config.refreshTokenCookieKey, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
    });
}
