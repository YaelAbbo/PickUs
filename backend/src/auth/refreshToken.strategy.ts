import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import type {
  JWTPayload,
  JWTPayloadWithRefresh,
  RequestWithCookies,
} from './types';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return (req?.cookies?.refreshToken || null) as string | null;
        },
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'REFRESH_TOKEN_SECRET',
    } as StrategyOptionsWithRequest);
  }

  validate(request: RequestWithCookies, payload: JWTPayload) {
    const refreshToken = (request
      .get('authorization')
      ?.replace('Bearer ', '') ?? request.cookies.refreshToken) as string;

    if (!refreshToken) throw new UnauthorizedException();

    const jwtPayloadWithRefresh = {
      ...payload,
      refreshToken,
    } satisfies JWTPayloadWithRefresh;

    return jwtPayloadWithRefresh;
  }
}
