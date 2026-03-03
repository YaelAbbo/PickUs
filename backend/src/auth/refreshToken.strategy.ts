import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';

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
          return req?.cookies?.refreshToken || null;
        },
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'REFRESH_TOKEN_SECRET',
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    const auth = req.get('authorization') || '';
    const refreshToken = auth.replace('Bearer ', '');
    return { sub: payload.sub, refreshToken: refreshToken, ...payload };
  }
}
