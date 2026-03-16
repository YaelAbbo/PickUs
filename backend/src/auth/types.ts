import type { User } from '@/database/entities';
import { IsNotEmpty, IsString } from 'class-validator';
import type { Request } from 'express';

export type AuthConfig = {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  bcryptSaltRounds: number;
  refreshTokenCookieKey: string;
};

export type JWTPayload = { sub: string; iat: number; exp: number };

export type WithRefreshToken<T = unknown> = T & { refreshToken: string };

export type JWTPayloadWithRefresh = WithRefreshToken<JWTPayload>;

export type AuthCookies = Partial<WithRefreshToken>;

export type RequestWithCookies = Request & { cookies: AuthCookies };

declare module 'express-serve-static-core' {
  interface Request {
    user: JWTPayload;
  }
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  nationalId: User['nationalId'];

  @IsString()
  @IsNotEmpty()
  password: string;
}
