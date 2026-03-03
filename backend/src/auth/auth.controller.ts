import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import ms, { type StringValue } from 'ms';
import { AccessTokenGuard } from './accessToken.guard';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './refreshToken.guard';
import type { AuthConfig, LoginDto } from './types';

@Controller('auth')
export class AuthController {
  private config: Pick<
    AuthConfig,
    'refreshTokenCookieKey' | 'jwtRefreshExpiration'
  >;
  constructor(private authService: AuthService) {
    this.config = {
      refreshTokenCookieKey:
        process.env.REFRESH_TOKEN_COOKIE_KEY || 'refreshToken',
      jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    };
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(body.id, body.password);
    this.setCookies(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(
    @Req() req: { user: { sub: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    this.clearCookies(res);
    return this.authService.logout(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Req() req: { user: { sub: string; refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    this.setCookies(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  setCookies(res: Response, refreshToken: string) {
    res.cookie(this.config.refreshTokenCookieKey, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ms(this.config.jwtRefreshExpiration as StringValue),
    });
  }

  clearCookies(res: Response) {
    res.clearCookie(this.config.refreshTokenCookieKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
