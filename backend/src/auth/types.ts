import type { User } from '@/database/entities';
import type { Request } from 'express';

export type AuthConfig = {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  bcryptSaltRounds: number;
  refreshTokenCookieKey: string;
};

export type LoginDTO = Pick<User, 'nationalId'> & { password: string };

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
