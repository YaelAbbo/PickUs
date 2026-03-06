import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import ms, { type StringValue } from 'ms';
import { UseAccessAuth, UseRefreshAuth } from './auth.decorator';
import { AuthService } from './auth.service';
import type { AuthConfig, LoginDto } from './types';

@Controller('auth')
export class AuthController {
  private config: Pick<
    AuthConfig,
    'refreshTokenCookieKey' | 'jwtRefreshExpiration'
  >;
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.config = {
      refreshTokenCookieKey: configService.get(
        'REFRESH_TOKEN_COOKIE_KEY',
        'refreshToken',
      ),
      jwtRefreshExpiration: configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    };
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(body.id, body.password);

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @UseAccessAuth()
  @Post('logout')
  async logout(
    @Req() req: { user: { sub: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    this.clearRefreshTokenCookie(res);

    return this.authService.logout(userId);
  }

  @UseRefreshAuth()
  @Post('refresh')
  async refresh(
    @Req() req: { user: { sub: string; refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;

    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @UseAccessAuth()
  @Get('verify')
  verify() {
    return; // Used for Nginx auth_request
  }

  private setRefreshTokenCookie = (response: Response, refreshToken: string) =>
    response.cookie(this.config.refreshTokenCookieKey, refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: ms(this.config.jwtRefreshExpiration as StringValue),
    });

  private clearRefreshTokenCookie = (response: Response) =>
    response.clearCookie(this.config.refreshTokenCookieKey, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
    });
}
